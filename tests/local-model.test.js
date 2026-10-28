import test from 'node:test';
import assert from 'node:assert/strict';
import { detectText, detectorSettings } from '../lib/detection.js';
import { scanSubmission } from '../lib/detection.js';
import { createStore } from '../lib/storage.js';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID, createHash } from 'node:crypto';

const TEXT = 'A public policy brief discusses evidence, implementation choices, stakeholder interests, and the feasibility of a proposed intervention. '.repeat(5);
const ENV = { IPC_AI_PROVIDER: 'local', IPC_LOCAL_STORAGE: 'true', IPC_MODEL_TOKEN: 'a-test-model-token-at-least-24-characters',
  IPC_AI_ENDPOINT: 'http://127.0.0.1:4319', IPC_ENABLE_AI_SCANS: 'true', IPC_MAX_SCANS_PER_DAY: '100' };
const result = (patch = {}) => ({ score: 0.63, label: 'ai', modelVersion: 'synthetic-protocol-test', experimental: true,
  scoreType: 'model_confidence', analyzedCharacters: TEXT.length, totalCharacters: TEXT.length, ...patch });
const json = body => new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } });

test('own detector requires an authenticated HTTPS service or a loopback development service', () => {
  const config = detectorSettings(ENV);
  assert.equal(config.enabled, true);
  assert.equal(config.experimental, true);
  assert.equal(config.label, 'IPC detector');
  assert.equal(config.endpoint, 'http://127.0.0.1:4319/predict');
  assert.equal(detectorSettings({ ...ENV, IPC_MODEL_TOKEN: 'short' }).enabled, false);
  assert.equal(detectorSettings({ ...ENV, VERCEL: '1' }).enabled, false);
  assert.equal(detectorSettings({ ...ENV, IPC_AI_ENDPOINT: 'http://remote.example' }).enabled, false);
  assert.equal(detectorSettings({ ...ENV, IPC_AI_ENDPOINT: 'https://model.example', VERCEL: '1' }).enabled, true);
  assert.equal(detectorSettings({ ...ENV, IPC_AI_ENDPOINT: 'https://user:pass@model.example' }).enabled, false);
});

test('own detector keeps model confidence, provenance and partial coverage distinct from probability', async () => {
  let seen;
  const scan = await detectText(TEXT, detectorSettings(ENV), async (url, init) => {
    seen = { url, ...init };
    return json(result({ analyzedCharacters: Math.floor(TEXT.length / 2), segments: [{ start: 0, end: 100, score: 0.64 }] }));
  });
  assert.equal(seen.url, 'http://127.0.0.1:4319/predict');
  assert.equal(seen.headers.Authorization, `Bearer ${ENV.IPC_MODEL_TOKEN}`);
  assert.deepEqual(JSON.parse(seen.body), { document: TEXT });
  assert.equal(seen.redirect, 'error');
  assert.equal(scan.scorePercent, 63);
  assert.equal(scan.scoreType, 'model_confidence');
  assert.equal(scan.experimental, true);
  assert(scan.coveragePercent > 49 && scan.coveragePercent <= 50);
  assert.equal(scan.segments[0].scorePercent, 64);
  assert.match(scan.validationSummary, /policy-brief validation is pending/i);
});

test('own detector rejects missing model provenance, untrusted coverage and invalid scores', async () => {
  for (const patch of [
    { score: -0.1 }, { score: '0.8' }, { score: null }, { modelVersion: '' }, { experimental: false },
    { scoreType: 'probability' }, { totalCharacters: TEXT.length - 1 }, { analyzedCharacters: TEXT.length + 1 },
    { analyzedCharacters: 0 }, { segments: [{ start: -1, end: 10, score: 0.5 }] },
    { segments: [{ start: 0, end: TEXT.length + 1, score: 0.5 }] },
  ]) await assert.rejects(detectText(TEXT, detectorSettings(ENV), async () => json(result(patch))));
  await assert.rejects(detectText(TEXT, detectorSettings(ENV), async () => new Response('', { status: 401 })), /HTTP 401/);
});

test('model upgrades rescore an old completed result once and reuse only the configured version', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'ipc-version-test-'));
  const store = await createStore({ IPC_LOCAL_STORAGE: 'true', IPC_DATA_DIR: dir });
  t.after(async () => { await store.close(); await rm(dir, { recursive: true, force: true }); });
  const row = { id: randomUUID(), receiptHash: createHash('sha256').update(randomUUID()).digest('hex'), email: 'version@example.com',
    filename: 'brief.txt', contentType: 'text/plain', createdAt: new Date().toISOString(), extractedText: TEXT,
    status: 'received', scan: { status: 'completed', provider: 'IPC detector', modelVersion: 'v1', scorePercent: 80 } };
  await store.create(row, Buffer.from(TEXT));
  const env = { ...ENV, IPC_MODEL_VERSION: 'v2' };
  let calls = 0;
  let release;
  let started;
  const gate = new Promise(resolve => { release = resolve; });
  const called = new Promise(resolve => { started = resolve; });
  const fetcher = async () => { calls++; started(); await gate; return json(result({ modelVersion: 'v2' })); };
  const first = scanSubmission(store, row.id, env, fetcher);
  await called;
  assert.equal((await scanSubmission(store, row.id, env, fetcher)).scan.status, 'processing');
  release();
  assert.equal((await first).scan.modelVersion, 'v2');
  assert.equal((await scanSubmission(store, row.id, env, fetcher)).scan.scorePercent, 63);
  assert.equal(calls, 1);
  await assert.rejects(detectText(TEXT, detectorSettings(env), async () => json(result({ modelVersion: 'v1' }))), /version differs/);
});
