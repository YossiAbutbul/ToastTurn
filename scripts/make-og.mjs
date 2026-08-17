// Rasterises the link preview card into public/. Run with `npm run og` after
// touching assets/og.svg.
//
// The type in that file is already outlines, converted from the app's own
// Baloo 2 and Nunito once, so rendering here needs no fonts installed and
// comes out identical on any machine.
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = await readFile(resolve(root, 'assets', 'og.svg'));

// Facebook and the rest want 1200x630, and will not scale a smaller one up.
const out = resolve(root, 'public', 'og.png');
await sharp(source, { density: 144 }).resize(1200, 630).png({ quality: 90 }).toFile(out);

const { width, height, size } = await sharp(out).metadata();
console.log(`og.png ${width}x${height}, ${Math.round(size / 1024)}KB`);
