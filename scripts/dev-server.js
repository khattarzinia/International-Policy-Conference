import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { createApp } from '../lib/app.js';

const app = await createApp();
const root = resolve('.');
const allowedFiles = new Set(['index.html', 'submit.html', 'submissions.html', 'robots.txt', 'sitemap.xml']);
const allowedFolders = ['final_IPC_website_files/', 'assets/', 'documents/'];
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.pdf': 'application/pdf', '.txt': 'text/plain', '.xml': 'application/xml', '.json': 'application/json', '.woff2': 'font/woff2', '.woff': 'font/woff' };
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname.startsWith('/api/')) {
      const request = new Request(new URL(req.url, 'http://localhost:4318'), { method: req.method, headers: req.headers,
        ...(['GET', 'HEAD'].includes(req.method) ? {} : { body: req, duplex: 'half' }) });
      const response = await app.fetch(request);
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(Buffer.from(await response.arrayBuffer()));
      return;
    }
    const path = decodeURIComponent(url.pathname).replace(/^\//, '') || 'index.html';
    const file = resolve(root, path);
    if (!file.startsWith(root + sep) || path.split('/').some(x => x.startsWith('.')) ||
      (!allowedFiles.has(path) && !allowedFolders.some(x => path.startsWith(x)))) { res.writeHead(404); res.end('Not found'); return; }
    const contents = await readFile(file);
    res.writeHead(200, { 'Content-Type': mime[extname(path)] || (path.endsWith('/css2') ? 'text/css' : 'application/octet-stream'), 'X-Content-Type-Options': 'nosniff' });
    res.end(contents);
  } catch { if (!res.headersSent) res.writeHead(404); res.end('Not found'); }
});
const port = Number(process.env.PORT || 4318);
server.listen(port, '127.0.0.1', () => console.log(`IPC portal: http://localhost:${port}/submit.html (${app.store.ready ? 'storage connected' : 'storage not configured'})`));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(async () => { await app.store.close(); process.exit(0); }));
