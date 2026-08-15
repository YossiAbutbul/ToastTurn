// Rasterises the icon sources into public/. Run with `npm run icons` after
// touching anything in assets/.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'public');

const jobs = [
  { src: 'icon-any.svg', name: 'pwa-192.png', size: 192 },
  { src: 'icon-any.svg', name: 'pwa-512.png', size: 512 },
  { src: 'icon-maskable.svg', name: 'pwa-maskable-192.png', size: 192 },
  { src: 'icon-maskable.svg', name: 'pwa-maskable-512.png', size: 512 },
  // iOS crops nothing but rounds the corners, so it takes the padded art too.
  { src: 'icon-maskable.svg', name: 'apple-touch-icon.png', size: 180 },
];

await mkdir(out, { recursive: true });

for (const job of jobs) {
  const svg = await readFile(resolve(root, 'assets', job.src));
  await sharp(svg, { density: 384 })
    .resize(job.size, job.size)
    .png()
    .toFile(resolve(out, job.name));
  console.log(`wrote public/${job.name}`);
}

// The favicon is the same drawing, kept as SVG so it stays sharp everywhere.
await writeFile(resolve(out, 'favicon.svg'), await readFile(resolve(root, 'assets', 'icon-any.svg')));
console.log('wrote public/favicon.svg');
