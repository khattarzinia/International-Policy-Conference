import { cp, mkdir, rm } from 'node:fs/promises';

// Only allowlisted public assets are published. Database files, secrets and
// server source never enter a static deployment.
await rm('public', { recursive: true, force: true });
await mkdir('public', { recursive: true });
for (const path of ['index.html', 'submit.html', 'submissions.html', 'final_IPC_website_files', 'assets', 'documents', 'robots.txt', 'sitemap.xml', 'CNAME']) {
  await cp(path, `public/${path}`, { recursive: true });
}
console.log('IPC public site built. Private server files are excluded.');
