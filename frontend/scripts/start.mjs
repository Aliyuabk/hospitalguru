import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const require = createRequire(import.meta.url);
const frontendDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
process.env.HOSTNAME = '0.0.0.0';
process.env.PORT ||= '3000';
require(resolve(frontendDir, '.next', 'standalone', 'server.js'));
