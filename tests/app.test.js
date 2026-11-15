import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../lib/app.js';
import { readBrief, MAX_FILE_BYTES } from '../lib/documents.js';

const ORIGIN = 'http://localhost:4318';
const TEXT = 'The district should fund reliable bus service to increase access to schools and medical appointments. Local evidence shows that limited service prevents residents from reaching essential services. The proposal evaluates public operating costs, access, and implementation time before selecting the recommended route. ';

async function fixture(t, additions = {}, options = {}) {
  const directory = await mkdtemp(join(tmpdir(), 'ipc-app-test-'));
  const env = {
    IPC_LOCAL_STORAGE: 'true', IPC_DATA_DIR: directory, IPC_ORIGIN: ORIGIN,
    IPC_ACCEPT_SUBMISSIONS: 'true', IPC_ADMIN_PASSWORD: 'organizer-test-passphrase-123456',
    IPC_SESSION_SECRET: 'session-test-secret-at-least-thirty-two-characters', ...additions,
  };
  const app = await createApp(env, options);
  t.after(async () => { await app.store.close(); await rm(directory, { recursive: true, force: true }); });
  return { app, env };
}

function request(path, { method = 'GET', body, origin = ORIGIN, cookie, headers = {} } = {}) {
  const values = { ...headers };
  if (origin !== null) values.Origin = origin;
  if (cookie) values.Cookie = cookie;
  if (body && !(body instanceof FormData) && !(body instanceof Buffer) && typeof body !== 'string') {
    body = JSON.stringify(body);
    values['Content-Type'] = 'application/json';
  }
  return new Request(ORIGIN + path, { method, headers: values, body });
}

function submission(changes = {}, file = new File([TEXT], 'policy.txt', { type: 'text/plain' })) {
  const form = new FormData();
  const fields = {
    contactName: 'Alex Student', email: 'Writer@Example.com', institution: 'Example School', country: 'Japan',
    teamName: '', teamMembers: '', category: 'Housing & Urban', title: 'Reliable transit access', conflicts: '',
    integrityAccepted: 'true', processingAccepted: 'true', website: '', ...changes,
  };
  for (const [key, value] of Object.entries(fields)) if (value !== undefined) form.set(key, value);
  if (file) form.set('brief', file);
  return form;
}

async function upload(app, changes = {}, file) {
  return app.fetch(request('/api/submissions', { method: 'POST', body: submission(changes, file) }));
}

async function login(app, password = 'organizer-test-passphrase-123456') {
  const response = await app.fetch(request('/api/admin/login', { method: 'POST', body: { password } }));
  assert.equal(response.status, 200);
  return { cookie: response.headers.get('set-cookie').split(';')[0], header: response.headers.get('set-cookie') };
}

test('valid upload persists original file and yields an independently verifiable private receipt', async (t) => {
  const { app, env } = await fixture(t);
  const response = await upload(app, { status: 'shortlisted', scan: '{"scorePercent":0}', receiptHash: 'supplied-by-client', email: 'Writer@Example.com' });
  assert.equal(response.status, 201);
  const result = await response.json();
  assert.match(result.submission.receiptCode, /^[A-Za-z0-9_-]{32}$/);
  assert.equal(result.submission.status, 'received');
  assert.equal(result.submission.scan.status, 'pending_configuration');
  assert.equal(result.submission.scan.scorePercent, null);
  const row = await app.store.get(result.submission.id);
  assert.equal(row.email, 'writer@example.com');
  assert.equal(row.extractedText, TEXT.trim());
  assert.notEqual(row.receiptHash, 'supplied-by-client');
  assert.deepEqual(await app.store.download(row), Buffer.from(TEXT));
  const lookup = await app.fetch(request('/api/receipt', { method: 'POST', body: { email: 'WRITER@example.com', receiptCode: result.submission.receiptCode } }));
  assert.equal(lookup.status, 200);
  assert.equal((await lookup.json()).submission.id, row.id);
  for (const body of [
    { email: 'other@example.com', receiptCode: result.submission.receiptCode },
    { email: 'writer@example.com', receiptCode: 'a'.repeat(32) },
  ]) assert.equal((await app.fetch(request('/api/receipt', { method: 'POST', body }))).status, 404);
  const publicText = JSON.stringify(result);
  for (const value of [env.IPC_SESSION_SECRET, env.IPC_ADMIN_PASSWORD, row.receiptHash, 'extractedText', 'storagePath', 'writer@example.com']) {
    assert.equal(publicText.includes(value), false, `Public response leaked ${value}`);
  }
  assert.equal(response.headers.get('cache-control'), 'no-store');
});

test('consent, expected fields and category are validated before any file is stored', async (t) => {
  const { app } = await fixture(t);
  for (const fields of [
    { integrityAccepted: 'false' }, { processingAccepted: undefined }, { category: 'Unapproved Category' },
    { contactName: '' }, { email: 'invalid-email' }, { website: 'automated-spam' }, { institution: 'x'.repeat(181) },
  ]) {
    const response = await upload(app, fields);
    assert.equal(response.status, 400, JSON.stringify(fields));
  }
  assert.equal((await app.store.list()).length, 0);
});

test('submission and lookup reject absent or foreign origins and malformed uploads', async (t) => {
  const { app } = await fixture(t);
  for (const origin of [null, 'https://unrelated.example']) {
    assert.equal((await app.fetch(request('/api/submissions', { method: 'POST', body: submission(), origin }))).status, 403);
    assert.equal((await app.fetch(request('/api/receipt', { method: 'POST', body: { email: 'writer@example.com', receiptCode: 'a'.repeat(32) }, origin }))).status, 403);
  }
  const malformed = await app.fetch(request('/api/submissions', { method: 'POST', body: 'invalid multipart', headers: { 'Content-Type': 'multipart/form-data; boundary=missing' } }));
  assert.equal(malformed.status, 400);
  const tooLarge = await app.fetch(request('/api/submissions', { method: 'POST', body: submission(), headers: { 'Content-Length': String(MAX_FILE_BYTES + 100000) } }));
  assert.equal(tooLarge.status, 413);
  const wrongType = await app.fetch(request('/api/submissions', { method: 'POST', body: { title: 'No attachment' } }));
  assert.equal(wrongType.status, 415);
});

test('unsupported, spoofed, corrupt and oversized files never create a submission', async (t) => {
  const { app } = await fixture(t);
  for (const file of [
    new File([TEXT], 'brief.html', { type: 'application/pdf' }),
    new File(['this is not a PDF'], 'brief.pdf', { type: 'application/pdf' }),
    new File(['%PDF-1.4\ntruncated content'], 'brief.pdf', { type: 'application/pdf' }),
    new File(['not a word document'], 'brief.docx'),
    new File([Buffer.from([0xff, 0xfe, 0x00])], 'brief.txt'),
    new File([Buffer.alloc(MAX_FILE_BYTES + 1, 'x')], 'brief.txt'),
    new File([], 'brief.txt'),
  ]) assert.equal((await upload(app, {}, file)).status, 400, file.name);
  assert.equal((await app.store.list()).length, 0);
});

test('organizer authentication protects listing and original downloads; review accepts only intended fields', async (t) => {
  const { app } = await fixture(t);
  const saved = (await (await upload(app)).json()).submission;
  const original = await app.store.get(saved.id);
  assert.equal((await app.fetch(request('/api/admin/submissions'))).status, 401);
  assert.equal((await app.fetch(request(`/api/admin/download?id=${saved.id}`))).status, 401);
  assert.equal((await app.fetch(request('/api/admin/login', { method: 'POST', body: { password: 'wrong' } }))).status, 401);
  const { cookie, header } = await login(app);
  assert.match(header, /HttpOnly/);
  assert.match(header, /SameSite=Strict/);
  assert.match(header, /Path=\/api/);
  assert.match(header, /Max-Age=28800/);
  const inbox = await app.fetch(request('/api/admin/submissions', { cookie }));
  assert.equal(inbox.status, 200);
  const organizerRow = (await inbox.json()).submissions[0];
  assert.equal(organizerRow.email, 'writer@example.com');
  assert.equal('receiptHash' in organizerRow, false);
  assert.equal('extractedText' in organizerRow, false);
  const file = await app.fetch(request(`/api/admin/download?id=${saved.id}`, { cookie }));
  assert.equal(file.status, 200);
  assert.deepEqual(Buffer.from(await file.arrayBuffer()), Buffer.from(TEXT));
  assert.match(file.headers.get('content-disposition'), /^attachment;/);
  assert.match(file.headers.get('content-security-policy'), /sandbox/);
  const review = await app.fetch(request('/api/admin/review', { method: 'POST', cookie, body: {
    id: saved.id, status: 'under_review', notes: 'Verify the cited evidence.', email: 'attacker@example.com', receiptHash: 'changed',
    scan: { status: 'completed', scorePercent: 0 }, extractedText: 'altered', filename: 'altered.txt',
  } }));
  assert.equal(review.status, 200);
  const changed = await app.store.get(saved.id);
  assert.equal(changed.status, 'under_review');
  assert.equal(changed.reviewNotes, 'Verify the cited evidence.');
  for (const name of ['email', 'receiptHash', 'scan', 'extractedText', 'filename']) assert.deepEqual(changed[name], original[name]);
  assert.equal((await app.fetch(request('/api/admin/review', { method: 'POST', cookie, origin: 'https://unrelated.example', body: { id: saved.id, status: 'not_selected' } }))).status, 403);
  assert.equal((await app.fetch(request('/api/admin/submissions', { cookie: cookie + 'tampered' }))).status, 401);
  const logout = await app.fetch(request('/api/admin/logout', { method: 'POST', cookie, body: {} }));
  assert.equal(logout.status, 200);
  assert.match(logout.headers.get('set-cookie'), /ipc_organizer=;/);
  assert.match(logout.headers.get('set-cookie'), /Max-Age=0/);
  assert.equal((await app.fetch(request('/api/admin/submissions', { cookie: 'ipc_organizer=' }))).status, 401);
});

test('missing storage, canonical origin or organizer credentials keeps acceptance closed', async (t) => {
  const bare = await createApp({});
  t.after(() => bare.store.close());
  const config = await (await bare.fetch(request('/api/config'))).json();
  assert.equal(config.acceptingSubmissions, false);
  assert.equal(config.storageReady, false);
  assert.equal((await bare.fetch(request('/api/submissions', { method: 'POST', body: submission() }))).status, 503);
  for (const additions of [{ IPC_ADMIN_PASSWORD: '' }, { IPC_SESSION_SECRET: '' }, { IPC_ORIGIN: '' }, { IPC_ACCEPT_SUBMISSIONS: 'false' }]) {
    const { app } = await fixture(t, additions);
    const body = await (await app.fetch(request('/api/config'))).json();
    assert.equal(body.acceptingSubmissions, false);
    assert.equal((await upload(app)).status, 503);
  }
});

function pdfFixture(text) {
  const content = `BT /F1 12 Tf 50 750 Td (${text}) Tj ET`;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>', `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`,
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((body, i) => { offsets.push(Buffer.byteLength(pdf)); pdf += `${i + 1} 0 obj\n${body}\nendobj\n`; });
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new File([pdf], 'research.pdf', { type: 'application/pdf' });
}

test('real PDF and Word document text is extracted from actual document bytes', async () => {
  const pdf = await readBrief(pdfFixture('The policy evidence supports reliable transit.'));
  assert.match(pdf.text, /policy evidence supports reliable transit/);
  assert.equal(pdf.contentType, 'application/pdf');
  const JSZip = (await import('jszip')).default;
  const archive = new JSZip();
  archive.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
  archive.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
  archive.file('word/document.xml', '<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>The policy evidence supports reliable transit.</w:t></w:r></w:p></w:body></w:document>');
  const bytes = await archive.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  const docx = await readBrief(new File([bytes], 'research.docx'));
  assert.match(docx.text, /policy evidence supports reliable transit/);
  assert.equal(docx.contentType, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
});

test('a detector outage still leaves the submission and receipt saved with no fabricated score', async (t) => {
  const { app } = await fixture(t, { IPC_AI_PROVIDER: 'gptzero', IPC_ENABLE_AI_SCANS: 'true', GPTZERO_API_KEY: 'test-detector-key', IPC_MAX_SCANS_PER_DAY: '1' }, {
    fetcher: async () => { throw new Error('Simulated transport failure'); },
  });
  const response = await upload(app);
  assert.equal(response.status, 201);
  const result = (await response.json()).submission;
  assert.equal(result.scan.status, 'failed');
  assert.equal(result.scan.scorePercent, null);
  assert.equal((await app.store.get(result.id)).status, 'received');
  const receipt = await app.fetch(request('/api/receipt', { method: 'POST', body: { email: 'writer@example.com', receiptCode: result.receiptCode } }));
  assert.equal(receipt.status, 200);
});

test('Word archive validation rejects forged uncompressed sizes before the document parser', async () => {
  const JSZip = (await import('jszip')).default;
  const archive = new JSZip();
  archive.file('word/document.xml', Buffer.alloc(21 * 1024 * 1024, 'x'));
  const bytes = await archive.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  // The archive is under 4MB but its stream expands beyond the 20MB processing
  // allowance. A dishonest central directory cannot bypass the actual bound.
  for (let offset = 0; offset + 46 < bytes.length; offset++) {
    if (bytes.readUInt32LE(offset) !== 0x02014b50) continue;
    const length = bytes.readUInt16LE(offset + 28);
    if (bytes.subarray(offset + 46, offset + 46 + length).toString() === 'word/document.xml') {
      bytes.writeUInt32LE(1, offset + 24);
      break;
    }
  }
  await assert.rejects(readBrief(new File([bytes], 'forged-size.docx')), /could not read|damaged|too large/);
});
