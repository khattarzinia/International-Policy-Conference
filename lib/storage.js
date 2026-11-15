import { mkdir, chmod } from 'node:fs/promises';
import { resolve, extname } from 'node:path';

const MAX_FILE_BYTES = 4 * 1024 * 1024;
const BUCKET = 'ipc-briefs';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const IMMUTABLE_FIELDS = new Set(['id', 'receiptHash', 'email', 'createdAt', 'storagePath', 'filename', 'contentType']);

function validateId(id) {
  if (typeof id !== 'string' || !UUID.test(id)) throw new Error('Invalid submission ID.');
}

function prepare(row, bytes) {
  validateId(row?.id);
  if (!Buffer.isBuffer(bytes) || bytes.length === 0 || bytes.length > MAX_FILE_BYTES) {
    throw new Error('The brief must be a nonempty file no larger than 4 MB.');
  }
  const extension = extname(row.filename || '').toLowerCase();
  if (!['.pdf', '.docx', '.txt'].includes(extension)) throw new Error('Unsupported brief file type.');
  if (!/^[a-f0-9]{64}$/i.test(row.receiptHash || '')) throw new Error('Invalid receipt hash.');
  if (typeof row.email !== 'string' || !row.email || row.email.length > 320) throw new Error('Invalid submission email.');
  if (!Number.isFinite(Date.parse(row.createdAt))) throw new Error('Invalid submission timestamp.');
  return JSON.parse(JSON.stringify({ ...row, storagePath: `${row.id}/brief${extension}` }));
}

function validatePatch(patch) {
  if (!patch || Array.isArray(patch) || typeof patch !== 'object') throw new Error('Invalid submission update.');
  if (Object.keys(patch).some((key) => IMMUTABLE_FIELDS.has(key))) throw new Error('Submission identity and file metadata cannot be changed.');
  return JSON.parse(JSON.stringify(patch));
}

function validateRate(key, windowSeconds, limit) {
  if (typeof key !== 'string' || !key || key.length > 256 || /[\u0000-\u001f]/.test(key)) throw new Error('Invalid rate limit key.');
  if (!Number.isSafeInteger(windowSeconds) || windowSeconds < 1 || windowSeconds > 31_536_000) throw new Error('Invalid rate limit window.');
  if (!Number.isSafeInteger(limit) || limit < 0 || limit > 1_000_000) throw new Error('Invalid rate limit allowance.');
}

function unavailableStore() {
  const fail = async () => { throw new Error('Submission storage is not configured.'); };
  return {
    ready: false, create: fail, get: fail, list: fail, submissionCount: fail, comparisonRows: fail, lookup: fail, update: fail,
    download: fail, consumeRate: fail, claimScan: fail, close: async () => {},
  };
}

async function localStore(env) {
  const directory = resolve(env.IPC_DATA_DIR || '.local/ipc');
  await mkdir(directory, { recursive: true, mode: 0o700 });
  await chmod(directory, 0o700);
  const { DatabaseSync } = await import('node:sqlite');
  const databasePath = resolve(directory, 'submissions.sqlite');
  const database = new DatabaseSync(databasePath);
  database.exec(`
    PRAGMA busy_timeout = 5000;
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS ipc_submissions (
      id TEXT PRIMARY KEY,
      receipt_hash TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL,
      created_at TEXT NOT NULL,
      data TEXT NOT NULL CHECK(json_valid(data)),
      file BLOB NOT NULL
    );
    CREATE INDEX IF NOT EXISTS ipc_submissions_created_idx ON ipc_submissions(created_at DESC, id DESC);
    CREATE TABLE IF NOT EXISTS ipc_rate_limits (
      rate_key TEXT NOT NULL,
      window_seconds INTEGER NOT NULL,
      window_start INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      attempts INTEGER NOT NULL,
      PRIMARY KEY (rate_key, window_seconds, window_start)
    );
    CREATE INDEX IF NOT EXISTS ipc_rate_limits_expiry_idx ON ipc_rate_limits(expires_at);
  `);
  await chmod(databasePath, 0o600);
  for (const suffix of ['-wal', '-shm']) {
    try { await chmod(databasePath + suffix, 0o600); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  const decode = (record) => record ? JSON.parse(record.data) : null;
  const get = (id) => {
    validateId(id);
    return decode(database.prepare('SELECT data FROM ipc_submissions WHERE id = ?').get(id));
  };
  // Keep all statements in a transaction synchronous so separate app instances cannot lose updates.
  const transaction = (operation) => {
    database.exec('BEGIN IMMEDIATE');
    try {
      const result = operation();
      database.exec('COMMIT');
      return result;
    } catch (error) {
      database.exec('ROLLBACK');
      throw error;
    }
  };
  return {
    ready: true,
    async create(row, bytes) {
      const record = prepare(row, bytes);
      database.prepare('INSERT INTO ipc_submissions (id, receipt_hash, email, created_at, data, file) VALUES (?, ?, ?, ?, ?, ?)')
        .run(record.id, record.receiptHash, record.email, record.createdAt, JSON.stringify(record), bytes);
      return record;
    },
    async get(id) { return get(id); },
    async list() {
      return database.prepare('SELECT data FROM ipc_submissions ORDER BY created_at DESC, id DESC LIMIT 500').all().map(decode);
    },
    async submissionCount() { return database.prepare('SELECT COUNT(*) AS count FROM ipc_submissions').get().count; },
    async comparisonRows() {
      return database.prepare("SELECT id, json_extract(data, '$.title') AS title, json_extract(data, '$.category') AS category, json_extract(data, '$.extractedText') AS extractedText FROM ipc_submissions ORDER BY id").all();
    },
    async lookup(receiptHash, email) {
      return decode(database.prepare('SELECT data FROM ipc_submissions WHERE receipt_hash = ? AND email = ?').get(receiptHash, email));
    },
    async update(id, patch) {
      const safePatch = validatePatch(patch);
      return transaction(() => {
        const previous = get(id);
        if (!previous) return null;
        const updated = { ...previous, ...safePatch };
        database.prepare('UPDATE ipc_submissions SET data = ? WHERE id = ?').run(JSON.stringify(updated), id);
        return updated;
      });
    },
    async download(row) {
      validateId(row?.id);
      const result = database.prepare('SELECT file FROM ipc_submissions WHERE id = ?').get(row.id);
      if (!result) throw new Error('Submission file was not found.');
      return Buffer.from(result.file);
    },
    async consumeRate(key, windowSeconds, limit) {
      validateRate(key, windowSeconds, limit);
      if (limit === 0) return false;
      const current = Math.floor(Date.now() / 1000);
      const start = Math.floor(current / windowSeconds) * windowSeconds;
      return transaction(() => {
        database.prepare('DELETE FROM ipc_rate_limits WHERE expires_at <= ?').run(current);
        const result = database.prepare(`INSERT INTO ipc_rate_limits (rate_key, window_seconds, window_start, expires_at, attempts)
          VALUES (?, ?, ?, ?, 1)
          ON CONFLICT (rate_key, window_seconds, window_start) DO UPDATE SET attempts = attempts + 1
          RETURNING attempts`).get(key, windowSeconds, start, start + windowSeconds);
        return result.attempts <= limit;
      });
    },
    async claimScan(id, modelVersion = null) {
      return transaction(() => {
        const previous = get(id);
        if (!previous) return null;
        if (previous.scan?.status === 'completed' && (!modelVersion || previous.scan.modelVersion === modelVersion)) return null;
        const started = Date.parse(previous.scan?.startedAt || '');
        if (previous.scan?.status === 'processing' && (!Number.isFinite(started) || started > Date.now() - 120_000)) return null;
        const updated = { ...previous, scan: { ...previous.scan, status: 'processing', startedAt: new Date().toISOString() } };
        database.prepare('UPDATE ipc_submissions SET data = ? WHERE id = ?').run(JSON.stringify(updated), id);
        return updated;
      });
    },
    async close() { database.close(); },
  };
}

function supabaseStore(baseURL, key) {
  const headers = { apikey: key };
  if (!key.startsWith('sb_secret_')) headers.Authorization = `Bearer ${key}`;
  async function request(path, options = {}) {
    let response;
    try {
      response = await fetch(`${baseURL}${path}`, {
        ...options,
        headers: { ...headers, ...options.headers },
        signal: AbortSignal.timeout(20_000),
      });
    } catch {
      throw new Error('Submission storage is temporarily unavailable.');
    }
    if (!response.ok) {
      // Never echo the upstream body, URL, credentials, file content, or submitted fields.
      const error = new Error('Submission storage could not complete this request.');
      error.status = response.status;
      throw error;
    }
    return response;
  }
  async function json(path, options = {}) {
    const response = await request(path, { ...options, headers: { 'Content-Type': 'application/json', ...options.headers } });
    return response.status === 204 ? null : response.json();
  }
  const rpc = (name, body) => json(`/rest/v1/rpc/${name}`, { method: 'POST', body: JSON.stringify(body) });
  const objectPath = (path) => `/storage/v1/object/${BUCKET}/${path.split('/').map(encodeURIComponent).join('/')}`;
  return {
    ready: true,
    async create(row, bytes) {
      const record = prepare(row, bytes);
      await request(objectPath(record.storagePath), { method: 'POST', headers: { 'Content-Type': record.contentType || 'application/octet-stream', 'x-upsert': 'false' }, body: bytes });
      try {
        await json('/rest/v1/ipc_submissions', {
          method: 'POST', headers: { Prefer: 'return=minimal' },
          body: JSON.stringify({ id: record.id, receipt_hash: record.receiptHash, email: record.email, created_at: record.createdAt, data: record }),
        });
      } catch (error) {
        try { await json(`/storage/v1/object/${BUCKET}`, { method: 'DELETE', body: JSON.stringify({ prefixes: [record.storagePath] }) }); }
        catch { console.error('IPC storage cleanup failed after an unsuccessful submission save.'); }
        throw error;
      }
      return record;
    },
    async get(id) {
      validateId(id);
      const params = new URLSearchParams({ id: `eq.${id}`, select: 'data', limit: '1' });
      return (await json(`/rest/v1/ipc_submissions?${params}`))[0]?.data || null;
    },
    async list() {
      const params = new URLSearchParams({ select: 'data', order: 'created_at.desc,id.desc', limit: '500' });
      return (await json(`/rest/v1/ipc_submissions?${params}`)).map((item) => item.data);
    },
    async submissionCount() {
      const response = await request('/rest/v1/ipc_submissions?select=id&limit=1', { headers: { Prefer: 'count=exact' } });
      await response.text();
      const match = response.headers.get('content-range')?.match(/\/(\d+)$/);
      if (!match || !Number.isSafeInteger(Number(match[1]))) throw new Error('Submission count could not be verified.');
      return Number(match[1]);
    },
    async comparisonRows() {
      const rows = [];
      // Keyset pagination keeps old entries in the comparison corpus; the inbox's
      // display limit must never silently become the plagiarism-checking limit.
      const snapshot = new Date().toISOString();
      let cursor;
      while (true) {
        const params = new URLSearchParams({
          select: 'id,title:data->>title,category:data->>category,extractedText:data->>extractedText',
          created_at: `lte.${snapshot}`, order: 'id.asc', limit: '200',
        });
        if (cursor) params.set('id', `gt.${cursor}`);
        const page = await json(`/rest/v1/ipc_submissions?${params}`);
        rows.push(...page);
        if (page.length < 200) return rows;
        const next = page.at(-1).id;
        if (next === cursor) throw new Error('Submission corpus pagination did not advance.');
        cursor = next;
      }
    },
    async lookup(receiptHash, email) {
      const params = new URLSearchParams({ receipt_hash: `eq.${JSON.stringify(receiptHash)}`, email: `eq.${JSON.stringify(email)}`, select: 'data', limit: '1' });
      return (await json(`/rest/v1/ipc_submissions?${params}`))[0]?.data || null;
    },
    async update(id, patch) {
      validateId(id);
      return rpc('ipc_update_submission', { p_id: id, p_patch: validatePatch(patch) });
    },
    async download(row) {
      validateId(row?.id);
      if (typeof row.storagePath !== 'string' || !new RegExp(`^${row.id}/brief\\.(pdf|docx|txt)$`).test(row.storagePath)) throw new Error('Invalid submission file path.');
      const response = await request(objectPath(row.storagePath));
      return Buffer.from(await response.arrayBuffer());
    },
    async consumeRate(key, windowSeconds, limit) {
      validateRate(key, windowSeconds, limit);
      if (limit === 0) return false;
      return rpc('ipc_consume_rate', { p_key: key, p_window_seconds: windowSeconds, p_limit: limit });
    },
    async claimScan(id, modelVersion = null) {
      validateId(id);
      if (modelVersion) return rpc('ipc_claim_scan_versioned', { p_id: id, p_model_version: modelVersion });
      return rpc('ipc_claim_scan', { p_id: id });
    },
    async close() {},
  };
}

export async function createStore(env = process.env) {
  if (env.IPC_LOCAL_STORAGE === 'true') {
    if (env.VERCEL || env.NODE_ENV === 'production') throw new Error('Local submission storage is disabled in production.');
    return localStore(env);
  }
  const key = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
  try {
    const url = new URL(env.SUPABASE_URL);
    if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash || typeof key !== 'string' || key.length < 24) return unavailableStore();
    return supabaseStore(url.origin, key);
  } catch { return unavailableStore(); }
}
