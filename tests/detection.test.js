import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import { createStore } from '../lib/storage.js';
import { detectorSettings, normalizeDetection, detectText, scanSubmission } from '../lib/detection.js';

const TEXT = 'The policy proposal compares the cost, feasibility, and equity of public transit funding. Evidence from a pilot project indicates that reliable service improves access to medical appointments and schools. The recommendation includes an implementation timetable and an evaluation plan using attendance and appointment outcomes. '.repeat(2);
const ENV = { IPC_AI_PROVIDER: 'gptzero', GPTZERO_API_KEY: 'test-key-never-used-live', IPC_ENABLE_AI_SCANS: 'true', IPC_MAX_SCANS_PER_DAY: '2' };
const response = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } });

async function fixture(t) {
  const directory = await mkdtemp(join(tmpdir(), 'ipc-detection-test-'));
  const store = await createStore({ IPC_LOCAL_STORAGE: 'true', IPC_DATA_DIR: directory });
  t.after(async () => { await store.close(); await rm(directory, { recursive: true, force: true }); });
  const add = async (changes = {}) => {
    const row = { id: randomUUID(), email: 'writer@example.com', receiptHash: createHash('sha256').update(randomUUID()).digest('hex'),
      filename: 'brief.txt', contentType: 'text/plain', createdAt: new Date().toISOString(), extractedText: TEXT,
      status: 'received', scan: { status: 'pending', provider: null, scorePercent: null }, ...changes };
    return store.create(row, Buffer.from(row.extractedText));
  };
  return { store, add };
}

test('scans require a key, explicit enablement, and a positive bounded daily allowance', () => {
  assert.equal(detectorSettings({}).enabled, false);
  assert.equal(detectorSettings({ ...ENV, IPC_ENABLE_AI_SCANS: 'false' }).enabled, false);
  assert.equal(detectorSettings({ ...ENV, GPTZERO_API_KEY: '' }).enabled, false);
  assert.equal(detectorSettings({ ...ENV, IPC_MAX_SCANS_PER_DAY: '0' }).enabled, false);
  assert.equal(detectorSettings({ ...ENV, IPC_MAX_SCANS_PER_DAY: '-1' }).enabled, false);
  assert.equal(detectorSettings({ ...ENV, IPC_MAX_SCANS_PER_DAY: '99999' }).dailyLimit, 10000);
  assert.equal(detectorSettings(ENV).enabled, true);
  assert.equal(detectorSettings({ ...ENV, IPC_AI_PROVIDER: 'unknown' }).enabled, false);
});

test('provider probabilities normalize without mislabeling missing or invalid data as zero', () => {
  assert.equal(normalizeDetection('gptzero', { documents: [{ class_probabilities: { ai: 0.7432 } }] }), 74.3);
  assert.equal(normalizeDetection('gptzero', { documents: [{ completely_generated_prob: 0 }] }), 0);
  assert.equal(normalizeDetection('sapling', { score: 1 }), 100);
  for (const value of [{}, { score: null }, { score: '0.9' }, { score: -0.01 }, { score: 1.1 }, { score: NaN }]) {
    assert.throws(() => normalizeDetection('sapling', value), /valid probability/);
  }
  assert.throws(() => normalizeDetection('gptzero', { documents: [{ class_probabilities: {} }] }), /valid probability/);
});

test('detector requests use each documented endpoint and server-side authentication', async () => {
  let seen;
  const fetcher = async (url, options) => { seen = { url, ...options }; return response({ documents: [{ class_probabilities: { ai: 0.23 } }] }); };
  assert.equal((await detectText(TEXT, detectorSettings(ENV), fetcher)).scorePercent, 23);
  assert.equal(seen.url, 'https://api.gptzero.me/v2/predict/text');
  assert.equal(seen.headers['x-api-key'], ENV.GPTZERO_API_KEY);
  assert.equal(JSON.parse(seen.body).document, TEXT);
  assert.ok(seen.signal instanceof AbortSignal);
  const sapling = detectorSettings({ IPC_AI_PROVIDER: 'sapling', SAPLING_API_KEY: 'sapling-test-key', IPC_ENABLE_AI_SCANS: 'true', IPC_MAX_SCANS_PER_DAY: '1' });
  const result = await detectText(TEXT, sapling, async (url, options) => { seen = { url, ...options }; return response({ score: 0.12 }); });
  assert.equal(result.scorePercent, 12);
  assert.equal(seen.url, 'https://api.sapling.ai/api/v1/aidetect');
  assert.equal(JSON.parse(seen.body).key, 'sapling-test-key');
  await assert.rejects(detectText(TEXT, detectorSettings(ENV), async () => response({}, 429)), /HTTP 429/);
});

test('mixed classification and low AI-only probability preserve the complete provider interpretation', async (t) => {
  const { store, add } = await fixture(t);
  const row = await add();
  const checked = await scanSubmission(store, row.id, ENV, async () => response({
    version: 'test-model-2026', documents: [{ predicted_class: 'mixed', confidence_category: 'high',
      class_probabilities: { ai: 0.02, mixed: 0.94, human: 0.04 } }],
  }));
  assert.equal(checked.scan.scorePercent, 2);
  assert.equal(checked.scan.classification, 'mixed');
  assert.equal(checked.scan.confidenceCategory, 'high');
  assert.equal(checked.scan.mixedScorePercent, 94);
  assert.equal(checked.scan.humanScorePercent, 4);
  assert.equal(checked.scan.modelVersion, 'test-model-2026');
  assert.equal(checked.status, 'received');
  assert.match(checked.scan.message, /AI-only class/);
  assert.match(checked.scan.message, /mixed and human/);
});

test('unconfigured and unreadable-text submissions remain saved without a detector call or score', async (t) => {
  const { store, add } = await fixture(t);
  let called = 0;
  const fetcher = async () => { called++; throw new Error('Must not be called'); };
  const pending = await add();
  const unconfigured = await scanSubmission(store, pending.id, {}, fetcher);
  assert.equal(unconfigured.scan.status, 'pending_configuration');
  assert.equal(unconfigured.scan.scorePercent, null);
  const short = await add({ extractedText: 'A very short brief.' });
  const manual = await scanSubmission(store, short.id, ENV, fetcher);
  assert.equal(manual.scan.status, 'manual_review');
  assert.equal(manual.scan.scorePercent, null);
  const long = await add({ extractedText: 'x'.repeat(150001) });
  assert.equal((await scanSubmission(store, long.id, ENV, fetcher)).scan.status, 'manual_review');
  assert.equal(called, 0);
});

test('daily quota limits real scan attempts while failures preserve files and never fabricate a score', async (t) => {
  const { store, add } = await fixture(t);
  const first = await add();
  const second = await add();
  let attempts = 0;
  const fetcher = async () => { attempts++; return response({ unexpected: 'provider changed response' }); };
  const env = { ...ENV, IPC_MAX_SCANS_PER_DAY: '1' };
  const failed = await scanSubmission(store, first.id, env, fetcher);
  assert.equal(failed.scan.status, 'failed');
  assert.equal(failed.scan.scorePercent, null);
  assert.deepEqual(await store.download(failed), Buffer.from(TEXT));
  const quota = await scanSubmission(store, second.id, env, fetcher);
  assert.equal(quota.scan.status, 'pending_quota');
  assert.equal(quota.scan.scorePercent, null);
  assert.equal(attempts, 1);
});

test('concurrent scans share the persisted claim and completed entries do not incur repeat calls', async (t) => {
  const { store, add } = await fixture(t);
  const row = await add();
  let calls = 0;
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  let started;
  const inFlight = new Promise(resolve => { started = resolve; });
  const fetcher = async () => { calls++; started(); await gate; return response({ documents: [{ class_probabilities: { ai: 0.41 } }] }); };
  const first = scanSubmission(store, row.id, ENV, fetcher);
  await inFlight;
  const parallel = await scanSubmission(store, row.id, ENV, fetcher);
  assert.equal(parallel.scan.status, 'processing');
  assert.equal(calls, 1);
  release();
  assert.equal((await first).scan.scorePercent, 41);
  const again = await scanSubmission(store, row.id, ENV, fetcher);
  assert.equal(again.scan.status, 'completed');
  assert.equal(calls, 1);
});

test('a stale pre-claim read cannot rescan a document another instance has already completed', async (t) => {
  const { store, add } = await fixture(t);
  const row = await add();
  let stale = true;
  const concurrentStore = { ...store, async get(id) {
    const value = await store.get(id);
    if (stale) {
      stale = false;
      await store.update(id, { scan: { status: 'completed', provider: 'GPTZero', scorePercent: 37 } });
    }
    return value;
  } };
  let calls = 0;
  const result = await scanSubmission(concurrentStore, row.id, ENV, async () => {
    calls++;
    return response({ documents: [{ class_probabilities: { ai: 0.5 } }] });
  });
  assert.equal(result.scan.status, 'completed');
  assert.equal(result.scan.scorePercent, 37);
  assert.equal(calls, 0);
});
