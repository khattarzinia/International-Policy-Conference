import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import { createStore } from '../lib/storage.js';

const makeRow = (changes = {}) => ({
  id: randomUUID(), receiptHash: createHash('sha256').update(randomUUID()).digest('hex'), email: 'writer@example.com',
  filename: 'Research Brief.TXT', contentType: 'text/plain', title: 'Evidence-led policy',
  createdAt: new Date().toISOString(), status: 'received', scan: { status: 'pending_configuration', scorePercent: null }, ...changes,
});

async function fixture(t) {
  const directory = await mkdtemp(join(tmpdir(), 'ipc-storage-test-'));
  const env = { IPC_LOCAL_STORAGE: 'true', IPC_DATA_DIR: directory };
  const store = await createStore(env);
  t.after(async () => { await store.close().catch(() => {}); await rm(directory, { recursive: true, force: true }); });
  return { store, env, directory };
}

test('unconfigured storage fails closed and local storage cannot run in production', async () => {
  const store = await createStore({});
  assert.equal(store.ready, false);
  await assert.rejects(store.list(), /not configured/);
  await assert.rejects(createStore({ IPC_LOCAL_STORAGE: 'true', VERCEL: '1' }), /disabled in production/);
  await assert.rejects(createStore({ IPC_LOCAL_STORAGE: 'true', NODE_ENV: 'production' }), /disabled in production/);
  assert.equal((await createStore({ SUPABASE_URL: 'http://unsafe.example', SUPABASE_SECRET_KEY: 's'.repeat(40) })).ready, false);
});

test('real local records and private original bytes survive a database restart', async (t) => {
  const { store, env, directory } = await fixture(t);
  const input = makeRow();
  const bytes = Buffer.from('Original research text\u0000\u00ff');
  const saved = await store.create(input, bytes);
  assert.equal(saved.storagePath, `${input.id}/brief.txt`);
  assert.deepEqual(await store.get(input.id), saved);
  assert.deepEqual(await store.download(saved), bytes);
  assert.equal((await stat(join(directory, 'submissions.sqlite'))).mode & 0o777, 0o600);
  assert.equal((await stat(directory)).mode & 0o777, 0o700);
  await store.close();
  const reopened = await createStore(env);
  t.after(() => reopened.close());
  assert.deepEqual(await reopened.get(input.id), saved);
  assert.deepEqual(await reopened.download(saved), bytes);
  assert.equal((await reopened.list()).length, 1);
});

test('receipt lookup requires both the exact stored email and receipt hash', async (t) => {
  const { store } = await fixture(t);
  const row = await store.create(makeRow(), Buffer.from('Policy'));
  assert.equal((await store.lookup(row.receiptHash, row.email)).id, row.id);
  assert.equal(await store.lookup(row.receiptHash, 'other@example.com'), null);
  assert.equal(await store.lookup('0'.repeat(64), row.email), null);
  assert.equal(await store.lookup(row.receiptHash, 'Writer@example.com'), null);
  assert.equal(await store.lookup("' OR 1=1 --", row.email), null);
});

test('updates preserve independent concurrent review and scan fields', async (t) => {
  const { store } = await fixture(t);
  const row = await store.create(makeRow(), Buffer.from('Policy'));
  await Promise.all([
    store.update(row.id, { status: 'under_review', reviewNotes: 'Verify source' }),
    store.update(row.id, { scan: { status: 'completed', scorePercent: 37 } }),
  ]);
  const updated = await store.get(row.id);
  assert.equal(updated.status, 'under_review');
  assert.equal(updated.reviewNotes, 'Verify source');
  assert.equal(updated.scan.scorePercent, 37);
  assert.deepEqual(await store.download(updated), Buffer.from('Policy'));
  await assert.rejects(store.update(row.id, { email: 'attacker@example.com' }), /cannot be changed/);
  assert.equal(await store.update(randomUUID(), { status: 'under_review' }), null);
});

test('persistent rate limits enforce the allowance across database instances', async (t) => {
  const { store, env } = await fixture(t);
  const second = await createStore(env);
  t.after(() => second.close());
  const results = await Promise.all([
    store.consumeRate('submission:one', 60, 2), second.consumeRate('submission:one', 60, 2), store.consumeRate('submission:one', 60, 2),
  ]);
  assert.deepEqual(results, [true, true, false]);
  assert.equal(await second.consumeRate('submission:one', 60, 2), false);
  assert.equal(await store.consumeRate('submission:two', 60, 2), true);
  assert.equal(await store.consumeRate('disabled', 60, 0), false);
  await assert.rejects(store.consumeRate('key', 0, 2), /Invalid rate limit window/);
});

test('only one instance may claim a scan until its lease is stale', async (t) => {
  const { store, env } = await fixture(t);
  const second = await createStore(env);
  t.after(() => second.close());
  const row = await store.create(makeRow(), Buffer.from('Policy'));
  const results = await Promise.all([store.claimScan(row.id), second.claimScan(row.id)]);
  assert.equal(results.filter(Boolean).length, 1);
  assert.equal((await store.get(row.id)).scan.status, 'processing');
  assert.equal(await second.claimScan(row.id), null);
  await store.update(row.id, { scan: { status: 'processing', startedAt: new Date(Date.now() - 121_000).toISOString() } });
  assert.equal((await second.claimScan(row.id)).id, row.id);
  assert.equal(await second.claimScan(randomUUID()), null);
});

test('rejected file inserts leave no partial submission record', async (t) => {
  const { store } = await fixture(t);
  const row = makeRow();
  await assert.rejects(store.create(row, Buffer.alloc(0)), /nonempty/);
  await assert.rejects(store.create(row, Buffer.alloc(4 * 1024 * 1024 + 1)), /4 MB/);
  await assert.rejects(store.create({ ...row, filename: 'payload.html' }, Buffer.from('x')), /Unsupported/);
  assert.equal((await store.list()).length, 0);
  await store.create(row, Buffer.from('first'));
  await assert.rejects(store.create(row, Buffer.from('second')));
  assert.equal((await store.list()).length, 1);
  assert.deepEqual(await store.download(row), Buffer.from('first'));
});

test('Supabase uploads privately before creating its row and uses modern server-key authentication', async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, ...options });
    return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  const key = `sb_secret_${'x'.repeat(30)}`;
  const store = await createStore({ SUPABASE_URL: 'https://ipc-example.supabase.co', SUPABASE_SECRET_KEY: key });
  const row = makeRow();
  const bytes = Buffer.from('A private brief.');
  const saved = await store.create(row, bytes);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].url, `https://ipc-example.supabase.co/storage/v1/object/ipc-briefs/${row.id}/brief.txt`);
  assert.equal(calls[0].method, 'POST');
  assert.equal(calls[0].headers.apikey, key);
  assert.equal(calls[0].headers.Authorization, undefined);
  assert.equal(calls[0].headers['x-upsert'], 'false');
  assert.deepEqual(calls[0].body, bytes);
  assert.equal(calls[1].url, 'https://ipc-example.supabase.co/rest/v1/ipc_submissions');
  assert.deepEqual(JSON.parse(calls[1].body).data, saved);
  await assert.rejects(store.download({ ...saved, storagePath: `${row.id}/../other.txt` }), /Invalid submission file path/);
});

test('Supabase removes an uploaded file if record creation fails without echoing upstream secrets', async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, ...options });
    if (calls.length === 2) return new Response('sensitive upstream details', { status: 500 });
    return new Response('{}', { status: 200 });
  };
  const store = await createStore({ SUPABASE_URL: 'https://ipc-example.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'legacy.jwt.server-key'.repeat(2) });
  const row = makeRow();
  await assert.rejects(store.create(row, Buffer.from('Policy')), (error) => {
    assert.equal(error.message, 'Submission storage could not complete this request.');
    assert.equal(error.status, 500);
    return true;
  });
  assert.equal(calls.length, 3);
  assert.equal(calls[2].method, 'DELETE');
  assert.equal(calls[2].url, 'https://ipc-example.supabase.co/storage/v1/object/ipc-briefs');
  assert.deepEqual(JSON.parse(calls[2].body), { prefixes: [`${row.id}/brief.txt`] });
  assert.equal(calls[0].headers.Authorization, `Bearer ${'legacy.jwt.server-key'.repeat(2)}`);
});
