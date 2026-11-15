import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

for (const folder of ['api', 'lib', 'scripts', 'tests', 'final_IPC_website_files']) {
  for (const filename of await readdir(folder)) {
    if (!filename.endsWith('.js')) continue;
    const result = spawnSync(process.execPath, ['--check', `${folder}/${filename}`], { stdio: 'inherit' });
    if (result.status) process.exit(result.status);
  }
}
console.log('JavaScript syntax checks passed.');
