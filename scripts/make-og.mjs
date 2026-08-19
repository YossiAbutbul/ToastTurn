// Rasterises the link preview card into public/. Run with `npm run og` after
// touching assets/og.svg, ToastSlice.tsx or the tokens.
//
// The slice is not drawn here. It comes from scripts/slice.mjs, which renders
// the app's own <ToastSlice/>, so the card cannot quietly come apart from the
// front door the way it did once already: a copy of the geometry pasted into
// the card went stale the next time the crumb moved, and nobody noticed until
// somebody put the two pictures side by side.
//
// The type in assets/og.svg is already outlines, converted from the app's own
// Baloo 2 and Nunito once, so rendering here needs no fonts installed and
// comes out identical on any machine.
import { readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { renderSlice, warnSkipped } from './slice.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Where the slice sits on the 1200x630 card. A nested <svg> rather than a
 * transform, so the component keeps its own viewBox and this only has to say
 * where the box goes.
 */
const PLACE = { x: 674.46, y: 79.12, width: 314.28, height: 349.92 };

// The card shows the whole scene, steam and counter shadow included.
const { markup, skipped } = await renderSlice();
warnSkipped(skipped);

const placed = markup.replace(
  '<svg',
  `<svg x="${PLACE.x}" y="${PLACE.y}" width="${PLACE.width}" height="${PLACE.height}"`,
);

const template = await readFile(resolve(root, 'assets', 'og.svg'), 'utf8');
const card = template.replace('<!--slice-->', placed);
if (!card.includes(placed)) throw new Error('assets/og.svg has no <!--slice--> to fill');

// Kept beside the card it came from, so the exact thing that was rasterised can
// be opened and looked at when the picture is wrong.
await writeFile(resolve(root, 'assets', 'og.built.svg'), card);

// Facebook and the rest want 1200x630, and will not scale a smaller one up.
const out = resolve(root, 'public', 'og.png');
await sharp(Buffer.from(card), { density: 144 }).resize(1200, 630).png({ quality: 90 }).toFile(out);

// The size comes off the file rather than the metadata: sharp reports it for a
// buffer and leaves it undefined for a path, which printed NaN.
const { width, height } = await sharp(out).metadata();
const { size } = await stat(out);
console.log(`og.png ${width}x${height}, ${Math.round(size / 1024)}KB`);
