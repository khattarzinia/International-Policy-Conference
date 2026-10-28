import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import { createStore } from '../lib/storage.js';

test('comparison corpus includes old submissions outside the organizer inbox display limit without secrets', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'ipc-corpus-'));
  const store = await createStore({ IPC_LOCAL_STORAGE: 'true', IPC_DATA_DIR: directory });
  t.after(async () => { await store.close(); await rm(directory, { recursive: true, force: true }); });
  let oldest;
  for (let i = 0; i < 503; i++) {
    const row = { id: randomUUID(), receiptHash: createHash('sha256').update(String(i)).digest('hex'),
      email: 'private@example.com', createdAt: new Date(1700000000000 + i * 1000).toISOString(),
      filename: 'brief.txt', contentType: 'text/plain', title: `Brief ${i}`, category: 'Education', extractedText: `Unique body ${i}` };
    await store.create(row, Buffer.from(row.extractedText));
    if (i === 0) oldest = row;
  }
  const inbox = await store.list();
  assert.equal(inbox.length, 500);
  assert(!inbox.some(row => row.id === oldest.id));
  const corpus = await store.comparisonRows();
  assert.equal(corpus.length, 503);
  assert(corpus.some(row => row.id === oldest.id));
  assert(corpus.every(row => !('email' in row) && !('receiptHash' in row) && !('file' in row)));
});

test('Supabase comparison corpus follows all keyset pages and requests body fields only', async t => {
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  const first = Array.from({ length: 200 }, (_, i) => ({ id: `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`, title: `Brief ${i}`, category: 'Health', extractedText: 'Body' }));
  let calls = 0;
  globalThis.fetch = async url => {
    const parsed = new URL(url);
    assert.equal(parsed.searchParams.get('order'), 'id.asc');
    assert.equal(parsed.searchParams.get('limit'), '200');
    assert.match(parsed.searchParams.get('select'), /extractedText:data->>extractedText/);
    assert(!parsed.searchParams.get('select').includes('receipt'));
    assert(parsed.searchParams.get('created_at').startsWith('lte.'));
    if (calls++ === 0) return Response.json(first);
    assert.equal(parsed.searchParams.get('id'), `gt.${first.at(-1).id}`);
    return Response.json([{ id: '00000000-0000-4000-8000-999999999999', extractedText: 'Old but included' }]);
  };
  const store = await createStore({ SUPABASE_URL: 'https://example.supabase.co', SUPABASE_SECRET_KEY: 'sb_secret_test_corpus_private_key' });
  assert.equal((await store.comparisonRows()).length, 201);
  assert.equal(calls, 2);
});
