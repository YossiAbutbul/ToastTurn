// The screenshots in the README. Run the dev server first, then `npm run
// screens`, and every picture in docs/screens is redrawn from the real app.
//
// It drives a headless Chrome over the DevTools protocol: seed one phone with
// a family nobody has to type in, open each screen, take the picture. The seed
// goes straight into localStorage rather than through the interface, so the
// pictures do not drift every time a button moves.
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'docs', 'screens');
const url = process.env.APP_URL ?? 'http://localhost:5173';
const port = Number(process.env.CDP_PORT ?? 9333);

/** The design size, at twice the pixels so the pictures stay sharp. */
const WIDTH = 390;
const HEIGHT = 844;
const SCALE = 2;

const CHROME_CANDIDATES = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ------------------------------------------------------------- the phone ---

/**
 * A family with enough behind it to be worth a picture: five people, seven
 * weeks of toast, ratings on some of it, and orders for everyone but the one
 * whose turn it is.
 */
const SEED = `(() => {
  const people = [
    { id: 'p1', name: 'Maya', color: '#E9553D', order: 0, active: true },
    { id: 'p2', name: 'Alon', color: '#F7C548', order: 1, active: true },
    { id: 'p3', name: 'Noa',  color: '#5FB99E', order: 2, active: true },
    { id: 'p4', name: 'Tal',  color: '#C8862F', order: 3, active: true },
    { id: 'p5', name: 'Ben',  color: '#8A5322', order: 4, active: true },
  ];
  const days = ['2026-08-16','2026-08-09','2026-08-02','2026-07-26','2026-07-19','2026-07-12','2026-07-05'];
  const who  = ['p5','p4','p3','p2','p1','p5','p4'];
  const turns = days.map((day, i) => ({
    id: 't' + i,
    personId: who[i],
    madeAt: day + 'T08:05:00.000Z',
    ratings: i % 2 === 0 ? { a: 5, b: 4 } : { a: 4 },
    skipped: false,
  }));
  localStorage.setItem('toastturn.families.v1', JSON.stringify([{
    id: 'demo-kitchen',
    name: 'The Abutbuls',
    people,
    turns,
  }]));
  localStorage.setItem('toastturn.orders.v1', JSON.stringify({ 'demo-kitchen': {
    p1: { personId: 'p1', slices: [{ bread: 'sliced', toppings: ['cheese','tomatoes'] }], updatedAt: '2026-08-18T09:00:00.000Z' },
    p2: { personId: 'p2', slices: [{ bread: 'challah', toppings: ['bulgarian','olives'] }, { bread: 'sliced', toppings: [] }], note: 'no crusts', updatedAt: '2026-08-18T09:01:00.000Z' },
    p3: { personId: 'p3', slices: [{ bread: 'sliced', toppings: ['ketchup'] }], updatedAt: '2026-08-18T09:02:00.000Z' },
    p4: { personId: 'p4', slices: [{ bread: 'tortilla', toppings: ['cheese','sriracha'] }], updatedAt: '2026-08-18T09:03:00.000Z' },
  } }));
  localStorage.setItem('toastturn.installHint.v1', 'dismissed');
  return 'seeded';
})()`;

/** Find a control by its words, whether they are visible or only read out. */
const CLICK = `(wanted) => {
  const controls = [...document.querySelectorAll('button, a, [role=button]')];
  const hit = controls.find((node) =>
    ((node.textContent || '') + ' ' + (node.getAttribute('aria-label') || ''))
      .trim().toLowerCase().includes(wanted));
  if (!hit) throw new Error('no control matching ' + wanted);
  hit.click();
}`;

/** Sheets are reached by tapping; each one is a screenshot of its own. */
const SHEETS = [
  { taps: ['order now'], name: 'orders' },
  { taps: ['history'], name: 'history' },
  { taps: ['history', 'every turn'], name: 'turns' },
  { taps: ['settings'], name: 'share' },
];

// ---------------------------------------------------------------- chrome ---

const chrome = spawn(CHROME_CANDIDATES[0], [
  '--headless=new',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${resolve(root, 'node_modules', '.cache', 'screens-profile')}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--hide-scrollbars',
  `--force-device-scale-factor=${SCALE}`,
  `--window-size=${WIDTH},${HEIGHT}`,
  'about:blank',
], { stdio: 'ignore' });

chrome.on('error', () => {
  console.error('No Chrome found. Set CHROME to the browser you have.');
  process.exit(1);
});

async function firstPage() {
  for (let i = 0; i < 60; i += 1) {
    try {
      const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      const page = targets.find((target) => target.type === 'page');
      if (page) return page;
    } catch {
      // Not listening yet.
    }
    await sleep(250);
  }
  throw new Error('Chrome never came up');
}

const socket = new WebSocket((await firstPage()).webSocketDebuggerUrl);
await new Promise((r) => socket.addEventListener('open', r, { once: true }));

let lastId = 0;
const waiting = new Map();
socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  const settle = waiting.get(message.id);
  if (settle) {
    waiting.delete(message.id);
    settle(message);
  }
});

function send(method, params = {}) {
  const id = (lastId += 1);
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((r) => waiting.set(id, r));
}

async function evaluate(expression) {
  const reply = await send('Runtime.evaluate', { expression, returnByValue: true });
  const failure = reply.error ?? reply.result?.exceptionDetails?.exception?.description;
  if (failure) throw new Error(typeof failure === 'string' ? failure : JSON.stringify(failure));
  return reply.result?.result?.value;
}

await send('Page.enable');
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', {
  width: WIDTH,
  height: HEIGHT,
  deviceScaleFactor: SCALE,
  mobile: true,
});

async function open() {
  await send('Page.navigate', { url });
  for (let i = 0; i < 80; i += 1) {
    await sleep(150);
    if (await evaluate('document.readyState === "complete"')) break;
  }
  await sleep(900); // The fonts, and the toaster's entrance.
}

await mkdir(out, { recursive: true });

async function shot(name) {
  const reply = await send('Page.captureScreenshot', { format: 'png' });
  const png = await sharp(Buffer.from(reply.result.data, 'base64'))
    .png({ compressionLevel: 9, palette: true })
    .toBuffer();
  await writeFile(resolve(out, `${name}.png`), png);
  console.log(`   ${name}.png  ${(png.length / 1024).toFixed(0)}kb`);
}

// ----------------------------------------------------------- the pictures ---

// The front door, on a phone that has never seen a rotation.
await open();
await evaluate('localStorage.clear()');
await open();
await shot('welcome');

await open();
await evaluate(SEED);
await open();
await shot('home');

for (const { taps, name } of SHEETS) {
  await open();
  for (const tap of taps) {
    await evaluate(`(${CLICK})(${JSON.stringify(tap)})`);
    await sleep(700);
  }
  await shot(name);
}

// Mid-cycle: the keyboard runs the same animation a drag does, and 1400ms in
// the slice has popped and the note is up.
await open();
await evaluate(`(() => {
  const lever = document.querySelector('[role="button"][aria-label*="Pull the lever"]');
  lever.focus();
  lever.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
})()`);
await sleep(1400);
await shot('logged');

socket.close();
chrome.kill();
console.log(`\nScreens in ${out}`);
