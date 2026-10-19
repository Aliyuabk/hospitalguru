import { spawn } from 'node:child_process';
import { networkInterfaces } from 'node:os';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = fileURLToPath(new URL('.', import.meta.url));
const frontendDir = resolve(scriptDir, '..');
const interfaces = networkInterfaces();
const addresses = Object.entries(interfaces).flatMap(([name, entries = []]) => entries
  .filter(entry => entry.family === 'IPv4' && !entry.internal && !entry.address.startsWith('169.254.'))
  .map(entry => ({ name, address: entry.address })));

console.log('\nBKD Pharmacy local network access');
console.log('This computer: http://localhost:3000');
if (addresses.length) {
  console.log('Other devices on the same network:');
  for (const entry of addresses) console.log(`  http://${entry.address}:3000 (${entry.name})`);
  console.log('The frontend API is served by this Next.js process; it connects to MySQL using DB_* settings.');
} else {
  console.log('No LAN IPv4 address detected. Check the server network connection.');
}
console.log('');

const nextBin = resolve(frontendDir, 'node_modules', 'next', 'dist', 'bin', 'next');
const child = spawn(process.execPath, [nextBin, 'dev', '-H', '0.0.0.0'], { cwd: frontendDir, stdio: 'inherit', env: process.env });
child.on('error', error => { console.error(`Could not start Next.js: ${error.message}`); process.exitCode = 1; });
child.on('exit', (code, signal) => { process.exitCode = signal === 'SIGINT' ? 130 : signal ? 1 : code ?? 1; });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
