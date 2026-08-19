// Rasterises the link preview card into public/. Run with `npm run og` after
// touching assets/og.svg, ToastSlice.tsx or the tokens.
//
// The slice is not drawn here. It is rendered from the app's own <ToastSlice/>
// and painted from its own stylesheet, so the card cannot quietly come apart
// from the front door the way it did once already: a copy of the geometry
// pasted into the card went stale the next time the crumb moved, and nobody
// noticed until somebody put the two side by side.
//
// The type in assets/og.svg is already outlines, converted from the app's own
// Baloo 2 and Nunito once, so rendering here needs no fonts installed and
// comes out identical on any machine.
import { readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (...parts) => readFile(resolve(root, ...parts), 'utf8');

/**
 * Where the slice sits on the 1200x630 card. A nested <svg> rather than a
 * transform, so the component keeps its own viewBox and this only has to say
 * where the box goes.
 */
const PLACE = { x: 674.46, y: 79.12, width: 314.28, height: 349.92 };

/** What a stylesheet can say that a rasteriser cares about. */
const PAINT = new Set([
  'fill',
  'fill-opacity',
  'stroke',
  'stroke-width',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-dasharray',
  'opacity',
]);

// ------------------------------------------------------------------ styles ---

/** `--crust: #C8862F;` from tokens.css, so var() can be resolved. */
function readTokens(css) {
  const tokens = new Map();
  for (const [, name, value] of css.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    tokens.set(name, value.trim());
  }
  return tokens;
}

/**
 * Drop `@keyframes`, whose stops (`45% { ... }`) read as rules to a flat parse
 * and whose declarations are never wanted here: the card is one frame, and the
 * steam is drawn at the opacity its class sets rather than mid-drift.
 */
function withoutKeyframes(css) {
  let out = '';
  let at = 0;
  while (at < css.length) {
    const start = css.indexOf('@keyframes', at);
    if (start < 0) return out + css.slice(at);
    out += css.slice(at, start);

    let depth = 0;
    let i = css.indexOf('{', start);
    for (; i < css.length; i += 1) {
      if (css[i] === '{') depth += 1;
      else if (css[i] === '}' && (depth -= 1) === 0) break;
    }
    at = i + 1;
  }
  return out;
}

/**
 * Class name to paint declarations, from ToastSlice.css.
 *
 * Only single-class selectors are read. The compound ones are the toasted
 * state (`.toast-slice.done .ts-crust`), and the card shows a slice that has
 * not been through the toaster, so leaving them out is the point rather than
 * an oversight. Anything else compound is reported: a paint rule that silently
 * failed to reach the card is the bug this whole script exists to prevent.
 */
function readRules(source, tokens) {
  const rules = new Map();
  const skipped = [];
  const css = withoutKeyframes(source.replace(/\/\*[\s\S]*?\*\//g, ''));

  for (const [, selector, body] of css.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
    const name = selector.trim();
    const declarations = [];

    for (const line of body.split(';')) {
      const at = line.indexOf(':');
      if (at < 0) continue;
      const property = line.slice(0, at).trim();
      if (!PAINT.has(property)) continue;

      const value = line
        .slice(at + 1)
        .trim()
        .replace(/var\((--[\w-]+)\)/g, (whole, token) => tokens.get(token) ?? whole);
      declarations.push([property, value]);
    }

    if (!declarations.length) continue;
    if (/^\.[\w-]+$/.test(name)) rules.set(name.slice(1), declarations);
    else if (!name.includes('.done')) skipped.push(name);
  }

  return { rules, skipped };
}

/** Swap every class for the attributes its rules paint. */
function inline(markup, rules) {
  return markup.replace(/ class="([^"]+)"/g, (whole, names) => {
    const attributes = names
      .split(/\s+/)
      .flatMap((name) => rules.get(name) ?? [])
      .map(([property, value]) => `${property}="${value}"`);
    return attributes.length ? ` ${attributes.join(' ')}` : '';
  });
}

// ------------------------------------------------------------- the drawing ---

const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'silent',
});
const { ToastSlice } = await server.ssrLoadModule('/src/components/ToastSlice.tsx');
const drawn = renderToStaticMarkup(createElement(ToastSlice));
await server.close();

const tokens = readTokens(await read('src', 'styles', 'tokens.css'));
const { rules, skipped } = readRules(await read('src', 'components', 'ToastSlice.css'), tokens);
if (skipped.length) {
  console.warn(`Not painted, no single-class rule: ${skipped.join(', ')}`);
}

const placed = inline(drawn, rules).replace(
  '<svg',
  `<svg x="${PLACE.x}" y="${PLACE.y}" width="${PLACE.width}" height="${PLACE.height}"`,
);

const card = (await read('assets', 'og.svg')).replace('<!--slice-->', placed);
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
