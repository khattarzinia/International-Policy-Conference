import { writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';

const config = [
  'IPC_LOCAL_STORAGE=true', 'IPC_DATA_DIR=.local/ipc', 'IPC_ACCEPT_SUBMISSIONS=true',
  'IPC_ORIGIN=http://localhost:4318', `IPC_ADMIN_PASSWORD=${randomBytes(24).toString('base64url')}`,
  `IPC_SESSION_SECRET=${randomBytes(36).toString('base64url')}`,
  'IPC_ENABLE_AI_SCANS=false', 'IPC_MAX_SCANS_PER_DAY=0', '',
].join('\n');
try {
  await writeFile('.env.local', config, { mode: 0o600, flag: 'wx' });
  console.log('Created private local settings. The organizer password is in .env.local. Run npm run dev.');
} catch (error) {
  if (error.code !== 'EEXIST') throw error;
  console.log('.env.local already exists; existing settings were preserved. Run npm run dev.');
}
