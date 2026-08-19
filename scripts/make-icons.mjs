// Rasterises the icons into public/. Run with `npm run icons` after touching
// ToastSlice.tsx or the tokens.
//
// The slice comes from scripts/slice.mjs, which renders the app's own
// <ToastSlice/>. It used to be a copy kept in assets/slice.svg, and being a
// copy it was a different drawing entirely by the end: the icons wore the
// prototype's in-toaster slice, flat-bottomed and two-humped, while the app
// had moved on to the one on the welcome screen.
//
// The steam and the counter shadow are left out. They are scenery on a
// kitchen counter, and at 192px on a coral tile they are a grey smudge.
//
// The slice is trimmed to its ink and then centred by measurement, not by hand
// arithmetic on the path — that is what got the first pass off-centre.
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { renderSlice, warnSkipped } from './slice.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'public');

const CORAL = '#E9553D';
/** Fraction of the canvas the slice may fill. */
const PLAIN = 0.74;
/** Maskable art has to survive a circular crop: keep it inside the middle 80%. */
const MASKABLE = 0.56;
/** Pixels per drawing unit when rasterising, comfortably past the 512 icon. */
const RASTER = 8;

const jobs = [
  { name: 'pwa-192.png', size: 192, fill: PLAIN },
  { name: 'pwa-512.png', size: 512, fill: PLAIN },
  { name: 'pwa-maskable-192.png', size: 192, fill: MASKABLE },
  { name: 'pwa-maskable-512.png', size: 512, fill: MASKABLE },
  // iOS crops nothing but rounds the corners, so it takes the padded art too.
  { name: 'apple-touch-icon.png', size: 180, fill: MASKABLE },
];

const { markup, inner, viewBox, skipped } = await renderSlice({
  omit: ['ts-steam', 'ts-shadow'],
});
warnSkipped(skipped);

// The component carries a viewBox and no size, because on the phone its size is
// whatever the layout gives it. A rasteriser needs to be told.
const source = Buffer.from(
  markup.replace(
    '<svg',
    `<svg width="${viewBox.width * RASTER}" height="${viewBox.height * RASTER}"`,
  ),
);

const full = await sharp(source).png().toBuffer();
const pxPerUnit = (await sharp(full).metadata()).width / viewBox.width;

const trimmed = await sharp(full).trim({ threshold: 1 }).toBuffer({ resolveWithObject: true });
const art = trimmed.data;
const { width, height, trimOffsetLeft, trimOffsetTop } = trimmed.info;

// Where the ink actually sits, in the drawing's own units.
const centre = {
  x: viewBox.x - trimOffsetLeft / pxPerUnit + width / pxPerUnit / 2,
  y: viewBox.y - trimOffsetTop / pxPerUnit + height / pxPerUnit / 2,
};
console.log(`slice ink centres on (${centre.x.toFixed(1)}, ${centre.y.toFixed(1)})`);

await mkdir(out, { recursive: true });

for (const job of jobs) {
  const box = Math.round(job.size * job.fill);
  const scaled = await sharp(art).resize(box, box, { fit: 'inside' }).png().toBuffer();

  await sharp({
    create: { width: job.size, height: job.size, channels: 4, background: CORAL },
  })
    .composite([{ input: scaled, gravity: 'centre' }])
    .png()
    .toFile(resolve(out, job.name));
  console.log(`wrote public/${job.name}`);
}

// The favicon is the same drawing, kept as SVG so it stays sharp everywhere.
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${CORAL}"/>
  <g transform="translate(256 256) scale(${((512 * PLAIN) / width) * pxPerUnit}) translate(${-centre.x} ${-centre.y})">
    ${inner}
  </g>
</svg>
`;
await writeFile(resolve(out, 'favicon.svg'), favicon);
console.log('wrote public/favicon.svg');
