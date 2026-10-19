import { cp, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const output = resolve('.next/standalone');
await mkdir(resolve(output, '.next'), { recursive: true });

await cp(resolve('.next/static'), resolve(output, '.next/static'), {
  recursive: true,
  force: true,
});

await cp(resolve('public'), resolve(output, 'public'), {
  recursive: true,
  force: true,
});
