// The app's own slice, rendered outside the app.
//
// Both the link preview card and the icons used to keep a copy of this
// drawing, and both copies drifted from the component the moment it changed.
// They ask for it here instead, so the geometry and the colours have one home:
// src/components/ToastSlice.tsx and its stylesheet.
//
// Nothing here knows what the slice looks like. It renders the component,
// resolves the tokens its stylesheet names, and hands back markup.
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (...parts) => readFile(resolve(root, ...parts), 'utf8');

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
 * and whose declarations are never wanted here: these are single frames, and
 * the steam is drawn at the opacity its class sets rather than mid-drift.
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
 * Class name to paint declarations.
 *
 * Only single-class selectors are read. The compound ones are the toasted
 * state (`.toast-slice.done .ts-crust`), and neither the card nor the icons
 * show a slice that has been through the toaster, so leaving them out is the
 * point rather than an oversight. Anything else compound is reported by the
 * caller: a paint rule that silently failed to arrive is the bug this whole
 * module exists to prevent.
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

/**
 * Cut out the element carrying this class, and everything inside it. Depth is
 * counted rather than matching the first closing tag, so a group holding
 * another group of the same name does not end the cut early.
 */
function without(markup, className) {
  const at = markup.search(new RegExp(`<\\w+[^>]*class="[^"]*\\b${className}\\b`));
  if (at < 0) throw new Error(`nothing carries the class ${className}`);

  const tag = markup.slice(at + 1).match(/^\w+/)[0];
  const opening = markup.slice(at, markup.indexOf('>', at) + 1);
  const cut = (upTo) => markup.slice(0, at) + markup.slice(upTo);
  if (opening.endsWith('/>')) return cut(at + opening.length);

  const token = new RegExp(`<${tag}\\b|</${tag}>`, 'g');
  token.lastIndex = at;
  let depth = 0;
  for (let found; (found = token.exec(markup)); ) {
    depth += found[0][1] === '/' ? -1 : 1;
    if (depth === 0) return cut(found.index + found[0].length);
  }
  throw new Error(`<${tag}> never closes`);
}

/**
 * Render `<ToastSlice/>` with its stylesheet baked into attributes.
 *
 * `omit` names classes to leave out — the icons drop the steam and the counter
 * shadow, which are scenery on the welcome screen and smudges at 192px.
 *
 * Returns the whole `<svg>`, its inner markup for anyone who wants to place the
 * parts themselves, the viewBox it was drawn in, and any selector whose paint
 * could not be applied.
 */
export async function renderSlice({ omit = [] } = {}) {
  const server = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
    logLevel: 'silent',
  });
  const { ToastSlice } = await server.ssrLoadModule('/src/components/ToastSlice.tsx');
  let markup = renderToStaticMarkup(createElement(ToastSlice));
  await server.close();

  for (const className of omit) markup = without(markup, className);

  const tokens = readTokens(await read('src', 'styles', 'tokens.css'));
  const { rules, skipped } = readRules(await read('src', 'components', 'ToastSlice.css'), tokens);
  markup = inline(markup, rules);

  const [, x, y, width, height] = markup
    .match(/viewBox="([\d.-]+) ([\d.-]+) ([\d.-]+) ([\d.-]+)"/)
    .map(Number);

  return {
    markup,
    inner: markup.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, ''),
    viewBox: { x, y, width, height },
    skipped,
  };
}

/** One place to say it, so both scripts say it the same way. */
export function warnSkipped(skipped) {
  if (skipped.length) {
    console.warn(`Not painted, no single-class rule: ${skipped.join(', ')}`);
  }
}
