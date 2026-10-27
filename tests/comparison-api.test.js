import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../lib/app.js';

const ORIGIN = 'http://localhost:4318';
const SOURCE = 'Municipal authorities should establish reliable evening transport services for residents who work outside conventional office hours. The proposal requires a published timetable, accessible vehicles, and independent monitoring of service cancellations. Local employers and disability advocates should participate in route planning to ensure that access improvements reach underserved neighborhoods. Quarterly evaluation should compare waiting times and appointment attendance before expanding the pilot. Funding decisions must publish operating costs and include a clear mechanism for residents to challenge missed service targets. ';
const OWN = 'The separate recommendation addresses school meal procurement through regional cooperatives that purchase seasonal ingredients directly from small farms. Procurement officers should negotiate transparent contracts while nutrition teams establish age appropriate dietary standards. Participating schools can measure food waste and student satisfaction through anonymous surveys conducted during lunch periods. A regional audit team should review invoice accuracy and kitchen staffing requirements before offering the framework to additional school districts. ';

async function fixture(t) {
  const directory = await mkdtemp(join(tmpdir(), 'ipc-comparison-api-'));
  const env = { IPC_LOCAL_STORAGE: 'true', IPC_DATA_DIR: directory, IPC_ORIGIN: ORIGIN, IPC_ACCEPT_SUBMISSIONS: 'true',
    IPC_ADMIN_PASSWORD: 'organizer-test-passphrase-123456', IPC_SESSION_SECRET: 'session-test-secret-at-least-thirty-two-characters' };
  const app = await createApp(env);
  t.after(async () => { await app.store.close(); await rm(directory, { recursive: true, force: true }); });
  const post = (path, body, cookie, origin = ORIGIN) => app.fetch(new Request(ORIGIN + path, { method: 'POST',
    headers: { Origin: origin, ...(cookie ? { Cookie: cookie } : {}), ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' }) },
    body: body instanceof FormData ? body : JSON.stringify(body) }));
  const upload = async (title, text, email) => {
    const form = new FormData();
    for (const [key, value] of Object.entries({ contactName: 'Synthetic Applicant', email, institution: 'Test School', country: 'Japan',
      category: 'Education', title, integrityAccepted: 'true', processingAccepted: 'true' })) form.set(key, value);
    form.set('brief', new File([text], 'brief.txt', { type: 'text/plain' }));
    const response = await post('/api/submissions', form);
    assert.equal(response.status, 201);
    return (await response.json()).submission;
  };
  const login = await post('/api/admin/login', { password: env.IPC_ADMIN_PASSWORD });
  const cookie = login.headers.get('set-cookie').split(';')[0];
  return { app, post, upload, cookie };
}

test('uploads automatically compare shared wording and keep other entrants passages out of public receipts', async t => {
  const { app, post, upload, cookie } = await fixture(t);
  const source = await upload('A private source title', SOURCE, 'source@example.com');
  const initial = await app.store.get(source.id);
  assert.equal(initial.comparisonSummary.comparedCount, 0);
  const target = await upload('A separate target title', SOURCE + OWN, 'target@example.com');
  const targetRow = await app.store.get(target.id);
  assert.equal(targetRow.comparisonSummary.status, 'completed');
  assert.equal(targetRow.comparisonSummary.comparedCount, 1);
  assert(targetRow.comparisonSummary.matchedWordPercent > 30 && targetRow.comparisonSummary.matchedWordPercent < 80);
  assert.equal(targetRow.status, 'received');
  const beforeRefresh = await app.fetch(new Request(ORIGIN + '/api/admin/submissions', { headers: { Cookie: cookie } }));
  const previousSource = (await beforeRefresh.json()).submissions.find(row => row.id === source.id);
  assert.equal(previousSource.comparisonSummary.stale, true);
  assert.equal('comparisonSummary' in target, false);
  assert.equal('comparison' in targetRow, false);
  const lookup = await post('/api/receipt', { email: 'target@example.com', receiptCode: target.receiptCode });
  const publicBody = await lookup.text();
  assert(!publicBody.includes('A private source title'));
  assert(!publicBody.includes('source@example.com'));
  assert(!publicBody.includes('matchedWordPercent'));
  assert.equal((await post('/api/admin/compare', { id: target.id })).status, 401);
  assert.equal((await post('/api/admin/compare', { id: target.id }, cookie, 'https://unrelated.example')).status, 403);
  const response = await post('/api/admin/compare', { id: target.id }, cookie);
  const report = (await response.json()).comparison;
  assert.equal(report.status, 'completed');
  assert.equal(report.matches[0].submissionId, source.id);
  assert(report.matches[0].passages[0].targetText.includes('Municipal authorities'));
  assert(report.matches[0].passages[0].sourceText.includes('Municipal authorities'));
  const previous = await post('/api/admin/compare', { id: source.id }, cookie);
  assert.equal((await previous.json()).comparison.comparedCount, 1);
  assert((await app.store.get(source.id)).comparisonSummary.matchedWordPercent > 0);
  const inbox = await app.fetch(new Request(ORIGIN + '/api/admin/submissions', { headers: { Cookie: cookie } }));
  const entry = (await inbox.json()).submissions.find(row => row.id === target.id);
  assert.equal(entry.comparisonSummary.status, 'completed');
  assert.equal(entry.comparisonSummary.stale, false);
  assert.equal('extractedText' in entry, false);
});

test('insufficient body text produces an unavailable comparison score rather than a clean result', async t => {
  const { app, post, upload, cookie } = await fixture(t);
  const entry = await upload('Short brief', 'A very short policy recommendation.', 'short@example.com');
  const response = await post('/api/admin/compare', { id: entry.id }, cookie);
  const report = (await response.json()).comparison;
  assert.equal(report.status, 'insufficient_text');
  assert.equal(report.matchedWordPercent, null);
  assert.equal((await app.store.get(entry.id)).status, 'received');
});
