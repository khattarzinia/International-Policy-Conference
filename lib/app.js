import { createHash, createHmac, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { createStore } from './storage.js';
import { InputError, MAX_FILE_BYTES, readBrief } from './documents.js';
import { detectorSettings, scanSubmission } from './detection.js';
import { compareStoredSubmission } from './comparison.js';

export const CATEGORIES = ['Health', 'Environmental', 'Economic & Fiscal', 'AI & Technology', 'Education', 'International Relations', 'Housing & Urban', 'Civil Rights'];
const STATUSES = ['received', 'under_review', 'shortlisted', 'not_selected'];
const hash = (value) => createHash('sha256').update(value).digest('hex');
const safeEqual = (left, right) => timingSafeEqual(Buffer.from(hash(String(left))), Buffer.from(hash(String(right))));
const COOKIE = 'ipc_organizer';
const SESSION_SECONDS = 8 * 3600;

function field(data, name, max, required = true) {
  const value = typeof data[name] === 'string' ? data[name].trim() : '';
  if ((required && !value) || value.length > max || /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(value)) {
    throw new InputError(`Please provide a valid ${name.replace(/([A-Z])/g, ' $1').toLowerCase()}${required ? '' : ' or leave it blank'}.`);
  }
  return value;
}

function publicRow(row, organizer = false) {
  const { id, title, createdAt, status, scan, filename, category } = row;
  const common = { id, title, createdAt, status, scan, filename, category };
  if (!organizer) return common;
  const { contactName, email, institution, country, teamName, teamMembers, conflicts, reviewNotes, fileBytes, comparisonSummary } = row;
  return { ...common, contactName, email, institution, country, teamName, teamMembers, conflicts, reviewNotes, fileBytes, comparisonSummary: comparisonSummary || null };
}

async function readLimited(request, limit) {
  const declared = Number(request.headers.get('content-length') || 0);
  if (declared > limit) throw new InputError('This request is too large.', 413);
  if (!request.body) return Buffer.alloc(0);
  const reader = request.body.getReader();
  let size = 0;
  const chunks = [];
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) { await reader.cancel(); throw new InputError('This request is too large.', 413); }
    chunks.push(Buffer.from(value));
  }
  return Buffer.concat(chunks);
}

async function jsonBody(request) {
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw new InputError('Send a JSON request.', 415);
  try {
    const parsed = JSON.parse((await readLimited(request, 16384)).toString('utf8'));
    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') throw new Error();
    return parsed;
  } catch (error) {
    if (error instanceof InputError) throw error;
    throw new InputError('The request could not be read. Please try again.');
  }
}

function settings(env) {
  const localDevelopment = env.IPC_LOCAL_STORAGE === 'true' && !env.VERCEL && env.NODE_ENV !== 'production';
  let origin;
  try {
    const parsed = new URL(env.IPC_ORIGIN);
    if (parsed.origin === env.IPC_ORIGIN && (parsed.protocol === 'https:' || (localDevelopment && ['localhost', '127.0.0.1'].includes(parsed.hostname)))) origin = parsed.origin;
  } catch { /* Closed until a canonical origin is configured. */ }
  const adminReady = (env.IPC_ADMIN_PASSWORD?.length >= 24) && (env.IPC_SESSION_SECRET?.length >= 32);
  return { localDevelopment, origin, adminReady };
}

export async function createApp(env = process.env, options = {}) {
  const store = options.store || await createStore(env);
  const config = settings(env);
  const detector = detectorSettings(env);
  const hmac = (text) => createHmac('sha256', env.IPC_SESSION_SECRET).update(text).digest('base64url');
  const session = (expiry) => `${expiry}.${hmac(`${expiry}:${hash(env.IPC_ADMIN_PASSWORD)}`)}`;
  const sessionCookie = (value, age = SESSION_SECONDS) => `${COOKIE}=${value}; Path=/api; HttpOnly; SameSite=Strict; Max-Age=${age}${config.localDevelopment ? '' : '; Secure'}`;
  const accepting = store.ready && config.adminReady && !!config.origin && env.IPC_ACCEPT_SUBMISSIONS === 'true';
  const requireStore = () => { if (!store.ready) throw new InputError('Submissions are not connected yet. Please try again once IPC opens the portal.', 503); };
  const requireOrigin = (request) => {
    const origin = request.headers.get('origin');
    if (!config.origin || origin !== config.origin) throw new InputError('Please use the IPC website to make this request.', 403);
  };
  const requireAdmin = (request) => {
    if (!config.adminReady) throw new InputError('Organizer access has not been configured.', 503);
    const token = request.headers.get('cookie')?.split(';').map(x => x.trim()).find(x => x.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
    const parts = token?.split('.') || [];
    const expiry = Number(parts[0]);
    if (!token || parts.length !== 2 || !Number.isSafeInteger(expiry) || expiry <= Date.now() || expiry > Date.now() + SESSION_SECONDS * 1000 + 60000 || !safeEqual(token, session(expiry))) {
      throw new InputError('Please sign in to the organizer inbox.', 401);
    }
  };
  const rate = async (request, name, limit, seconds = 3600) => {
    const address = request.headers.get(env.VERCEL ? 'x-vercel-forwarded-for' : 'x-forwarded-for')?.split(',')[0].trim() || 'unknown';
    const identity = createHmac('sha256', env.IPC_SESSION_SECRET || 'ipc-unconfigured').update(address).digest('hex');
    if (!await store.consumeRate(`${name}:${identity}`, seconds, limit)) throw new InputError('Too many attempts. Please try again later.', 429);
  };
  const getId = (data) => {
    const id = field(data, 'id', 36);
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) throw new InputError('Choose a valid submission.');
    return id;
  };

  return { store, async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, '');
    const respond = (body, status = 200, headers = {}) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers } });
    try {
      if (path === '/api/config' && request.method === 'GET') return respond({ acceptingSubmissions: accepting, storageReady: store.ready,
        detectorConfigured: detector.enabled, detectorProvider: detector.enabled ? detector.label : null,
        maxFileBytes: MAX_FILE_BYTES, categories: CATEGORIES, localDevelopment: config.localDevelopment,
        similarityEnabled: true, detectorExperimental: detector.experimental });

      if (path === '/api/submissions' && request.method === 'POST') {
        requireStore();
        if (!accepting) throw new InputError('The IPC submission portal is not accepting entries yet.', 503);
        requireOrigin(request);
        await rate(request, 'submission', 10);
        if (!await store.consumeRate('submissions:global', 86400, 200)) throw new InputError('The portal has reached its daily upload allowance. Please try again later.', 429);
        const type = request.headers.get('content-type') || '';
        if (!type.startsWith('multipart/form-data;')) throw new InputError('Please attach your brief using the submission form.', 415);
        let form;
        const bytes = await readLimited(request, MAX_FILE_BYTES + 32768);
        try { form = await new Response(bytes, { headers: { 'Content-Type': type } }).formData(); }
        catch { throw new InputError('We could not read your upload. Please choose the file again.'); }
        const data = Object.fromEntries(form);
        if (data.website) throw new InputError('We could not accept this request.');
        if (data.integrityAccepted !== 'true' || data.processingAccepted !== 'true') throw new InputError('Please confirm academic integrity and document processing before submitting.');
        const email = field(data, 'email', 254).toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new InputError('Please enter a valid email address.');
        const category = field(data, 'category', 80);
        if (!CATEGORIES.includes(category)) throw new InputError('Please select an IPC policy category.');
        const row = {
          id: randomUUID(), receiptHash: '', email, category,
          contactName: field(data, 'contactName', 120), institution: field(data, 'institution', 180), country: field(data, 'country', 100),
          title: field(data, 'title', 240), teamName: field(data, 'teamName', 160, false), teamMembers: field(data, 'teamMembers', 2000, false),
          conflicts: field(data, 'conflicts', 3000, false), createdAt: new Date().toISOString(), status: 'received', reviewNotes: '',
          integrityAcceptedAt: new Date().toISOString(), processingConsentVersion: '2026-10-27-analysis-v2',
          scan: { status: 'pending', provider: null, scorePercent: null, message: 'Saved. Screening is pending.' },
          comparisonSummary: { status: 'pending', matchedWordPercent: null, comparedCount: null },
        };
        const document = await readBrief(form.get('brief'));
        const receiptCode = randomBytes(24).toString('base64url');
        Object.assign(row, { receiptHash: hash(receiptCode), extractedText: document.text, filename: document.filename, contentType: document.contentType,
          fileBytes: document.bytes.length, fileHash: hash(document.bytes) });
        const saved = await store.create(row, document.bytes);
        try { await compareStoredSubmission(store, row.id, { maxMatches: 0, includePassages: false }); }
        catch (error) {
          console.error('IPC submission comparison deferred:', error.name);
          await store.update(row.id, { comparisonSummary: { status: 'failed', matchedWordPercent: null, comparedCount: null } }).catch(() => {});
        }
        // Save first. Detector outages must never lose an otherwise valid submission.
        let screened = saved;
        try { screened = await scanSubmission(store, row.id, env, options.fetcher); }
        catch (error) { console.error('IPC screening deferred:', error.name); }
        return respond({ submission: { ...publicRow(screened || saved), receiptCode } }, 201);
      }

      if (path === '/api/receipt' && request.method === 'POST') {
        requireStore(); requireOrigin(request);
        await rate(request, 'receipt', 30);
        const body = await jsonBody(request);
        const receiptCode = field(body, 'receiptCode', 64);
        const email = field(body, 'email', 254).toLowerCase();
        if (!/^[A-Za-z0-9_-]{32}$/.test(receiptCode)) throw new InputError('No submission was found for that email and receipt code.', 404);
        const row = await store.lookup(hash(receiptCode), email);
        if (!row) throw new InputError('No submission was found for that email and receipt code.', 404);
        return respond({ submission: publicRow(row) });
      }

      if (path === '/api/admin/login' && request.method === 'POST') {
        requireStore(); requireOrigin(request);
        if (!config.adminReady) throw new InputError('Organizer access has not been configured.', 503);
        await rate(request, 'login', 8, 900);
        const body = await jsonBody(request);
        if (typeof body.password !== 'string' || body.password.length > 512 || !safeEqual(body.password, env.IPC_ADMIN_PASSWORD)) throw new InputError('The organizer password is incorrect.', 401);
        return respond({ ok: true }, 200, { 'Set-Cookie': sessionCookie(session(Date.now() + SESSION_SECONDS * 1000)) });
      }

      if (path.startsWith('/api/admin/')) {
        requireStore(); requireAdmin(request);
        if (request.method !== 'GET') requireOrigin(request);
        if (path === '/api/admin/logout' && request.method === 'POST') return respond({ ok: true }, 200, { 'Set-Cookie': sessionCookie('', 0) });
        if (path === '/api/admin/submissions' && request.method === 'GET') {
          const total = await store.submissionCount();
          const submissions = (await store.list()).map(row => {
            const entry = publicRow(row, true);
            if (entry.comparisonSummary?.status === 'completed') entry.comparisonSummary = { ...entry.comparisonSummary,
              stale: entry.comparisonSummary.corpusTotal !== Math.max(0, total - 1) };
            return entry;
          });
          return respond({ submissions, detectorConfigured: detector.enabled });
        }
        if (path === '/api/admin/compare' && request.method === 'POST') {
          await rate(request, 'admin-comparison', 60);
          const data = await jsonBody(request);
          const comparison = await compareStoredSubmission(store, getId(data));
          if (!comparison) throw new InputError('This submission could not be found.', 404);
          return respond({ comparison });
        }
        if (path === '/api/admin/download' && request.method === 'GET') {
          const row = await store.get(getId({ id: url.searchParams.get('id') }));
          if (!row) throw new InputError('This submission could not be found.', 404);
          return new Response(await store.download(row), { headers: { 'Content-Type': row.contentType,
            'Content-Disposition': `attachment; filename="brief${row.filename.slice(row.filename.lastIndexOf('.')).toLowerCase()}"; filename*=UTF-8''${encodeURIComponent(row.filename).replace(/['()*]/g, c => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)}`,
            'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'; sandbox" } });
        }
        if (path === '/api/admin/review' && request.method === 'POST') {
          const data = await jsonBody(request);
          const id = getId(data);
          if (!STATUSES.includes(data.status)) throw new InputError('Choose a valid review status.');
          const updated = await store.update(id, { status: data.status, reviewNotes: field(data, 'notes', 5000, false), reviewedAt: new Date().toISOString() });
          if (!updated) throw new InputError('This submission could not be found.', 404);
          return respond({ submission: publicRow(updated, true) });
        }
        if (path === '/api/admin/scan' && request.method === 'POST') {
          await rate(request, 'admin-scan', 50);
          const data = await jsonBody(request);
          const updated = await scanSubmission(store, getId(data), env, options.fetcher);
          if (!updated) throw new InputError('This submission could not be found.', 404);
          return respond({ submission: publicRow(updated, true) });
        }
      }
      return respond({ error: 'This endpoint is not available.' }, 404);
    } catch (error) {
      if (error instanceof InputError) return respond({ error: error.message }, error.status);
      console.error('IPC request failed:', path, error.name);
      return respond({ error: 'We could not complete this request. Please try again.' }, 503);
    }
  } };
}
