import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const cwd = fileURLToPath(new URL('../', import.meta.url));
const children = [
  spawn(process.execPath, ['--env-file-if-exists=.env', 'server/index.mjs'], { cwd, stdio: 'inherit' }),
  spawn(process.execPath, ['node_modules/expo/bin/cli', 'start', '--port', '8087', '--web'], { cwd, stdio: 'inherit' }),
];
let stopping = false;
function stop(code = 0) { if (stopping) return; stopping = true; children.forEach(child => child.kill('SIGTERM')); setTimeout(() => process.exit(code), 500).unref(); }
for (const child of children) child.on('exit', code => stop(code || 0));
process.on('SIGINT', () => stop()); process.on('SIGTERM', () => stop());
