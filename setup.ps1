# ToastTurn - setup inside an existing repo (Windows / PowerShell)
#
# Safe to run in a repo you already created. It never overwrites an existing
# file: anything already present is reported and skipped. Safe to re-run.
#
# Usage, from the repo folder:
#   powershell -ExecutionPolicy Bypass -File setup.ps1

$ErrorActionPreference = 'Stop'
$env:npm_config_yes = 'true'   # stop npm from prompting

function Say  ($m) { Write-Host "`n$m" -ForegroundColor Cyan }
function Made ($m) { Write-Host "   new   $m" -ForegroundColor Green }
function Skip ($m) { Write-Host "   skip  $m (already exists)" -ForegroundColor DarkGray }
function Note ($m) { Write-Host "   $m" -ForegroundColor DarkGray }

function Write-IfMissing($Path, $Content) {
  if (Test-Path $Path) { Skip $Path; return }
  $dir = Split-Path -Parent $Path
  if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
  $full = Join-Path (Get-Location) $Path
  [System.IO.File]::WriteAllText($full, $Content, (New-Object System.Text.UTF8Encoding $false))
  Made $Path
}

# ------------------------------------------------------------------ checks ---
if (-not (Test-Path .git)) {
  Write-Host "Not a git repo. cd into your repo folder first." -ForegroundColor Red; exit 1
}

$nodeMajor = 0
try { $nodeMajor = [int]((node -v) -replace '^v(\d+)\..*$', '$1') } catch {
  Write-Host "Node.js not found on PATH. Install Node 20 or newer, then re-run." -ForegroundColor Red; exit 1
}
if ($nodeMajor -lt 20) {
  Write-Host "Node $nodeMajor found. Vite needs 20 or newer. Upgrade, then re-run." -ForegroundColor Red; exit 1
}
Note "Node v$nodeMajor OK"

# ---------------------------------------------------------------- scaffold ---
if (Test-Path package.json) {
  Say "package.json found - keeping your setup"
  if (-not (Select-String -Path package.json -Pattern '"react"' -Quiet)) {
    Write-Host "   Warning: no react dependency. If this isn't a React app, stop and run:" -ForegroundColor Yellow
    Write-Host "   npm create vite@latest . -- --template react-ts" -ForegroundColor Yellow
  }
} else {
  Say "Empty repo - scaffolding Vite + React + TypeScript in place"
  npm create vite@latest . -- --template react-ts
  if ($LASTEXITCODE -ne 0) { Write-Host "Scaffold failed." -ForegroundColor Red; exit 1 }
}

# ------------------------------------------------------------ dependencies ---
Say "Dependencies"
$pkg  = Get-Content package.json -Raw | ConvertFrom-Json
$have = @()
if ($pkg.dependencies)    { $have += $pkg.dependencies.PSObject.Properties.Name }
if ($pkg.devDependencies) { $have += $pkg.devDependencies.PSObject.Properties.Name }

$runtime = @('nanoid','date-fns','@fontsource/baloo-2','@fontsource/nunito') | Where-Object { $have -notcontains $_ }
$dev     = @('vite-plugin-pwa','vitest','jsdom','@testing-library/react','@testing-library/jest-dom') | Where-Object { $have -notcontains $_ }

if ($runtime) { npm install $runtime }   else { Note "runtime deps present" }
if ($dev)     { npm install -D $dev }    else { Note "dev deps present" }

# ----------------------------------------------------------------- folders ---
Say "Folders"
'src/components','src/screens','src/hooks','src/lib','src/store','src/styles','src/i18n','docs' |
  ForEach-Object { New-Item -ItemType Directory -Path $_ -Force | Out-Null }
Note "ok"

# ------------------------------------------------------------------- files ---
Say "Files"

Write-IfMissing 'src/styles/tokens.css' @'
:root {
  /* surfaces */
  --sky:       #DCE7EE;
  --sky-2:     #CBDCE7;
  --counter:   #EADFCB;
  --paper:     #FFFDF7;

  /* toaster */
  --coral:     #E9553D;
  --coral-lt:  #F4785F;
  --coral-dk:  #C93E2A;
  --chrome:    #DCE5EA;
  --chrome-dk: #AFBCC4;

  /* bread */
  --butter:    #F7C548;
  --crust:     #C8862F;
  --toasted:   #8A5322;
  --toasted-lt:#B4762F;

  /* ink + status */
  --ink:       #2B2420;
  --ink-soft:  #6E635C;
  --mint:      #5FB99E;
  --coil:      #FF5C22;

  /* type */
  --display: 'Baloo 2', system-ui, sans-serif;
  --ui:      'Nunito', system-ui, sans-serif;

  /* motion - see CLAUDE.md, do not slow these down */
  --t-toasting: 1050ms;
  --t-pop:       300ms;
  --t-reset:     650ms;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .01ms !important;
    transition-duration: .05ms !important;
  }
}
'@

Write-IfMissing 'src/styles/base.css' @'
@import './tokens.css';

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body, #root { height: 100%; }

body {
  font-family: var(--ui);
  color: var(--ink);
  background: var(--sky-2);
  overflow: hidden;
  -webkit-tap-highlight-color: transparent;
}

:focus-visible { outline: 3px solid var(--mint); outline-offset: 2px; }

/* the phone canvas: wall on top, countertop below */
.app {
  position: relative;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg,
    var(--sky) 0%, var(--sky) 63%, var(--counter) 63%, var(--counter) 100%);
  padding-block-start: env(safe-area-inset-top);
  padding-block-end: env(safe-area-inset-bottom);
}

@media (min-width: 700px) {
  body { display: flex; align-items: center; justify-content: center; background: #B9CBD7; padding: 24px; }
  .app {
    width: 392px;
    height: min(844px, calc(100dvh - 48px));
    border: 4px solid var(--ink);
    border-radius: 44px;
    overflow: hidden;
  }
}
'@

Write-IfMissing 'src/lib/types.ts' @'
export type Person = {
  id: string;
  name: string;
  color: string;
  order: number;
  active: boolean;
};

export type Turn = {
  id: string;
  personId: string;
  madeAt: string;   // ISO
  rating?: number;  // 1-5
  skipped: boolean;
};

export type Schedule = {
  weekday: number;  // 0 = Sunday
  time: string;     // "20:00"
  remind: boolean;
};

export type Family = {
  id: string;
  name: string;
  people: Person[];
  schedule: Schedule;
  turns: Turn[];    // newest first
};
'@

Write-IfMissing 'src/lib/rotation.ts' @'
import type { Family, Person } from './types';

/** Active people, in rotation order. */
export function roster(family: Family): Person[] {
  return family.people.filter(p => p.active).sort((a, b) => a.order - b.order);
}

/**
 * Whose turn it is. Derived, never stored - storing an index drifts
 * the moment two phones write at once.
 */
export function getCurrentPerson(family: Family): Person | null {
  const list = roster(family);
  if (list.length === 0) return null;

  const lastReal = family.turns
    .filter(t => !t.skipped)
    .sort((a, b) => b.madeAt.localeCompare(a.madeAt))[0];

  if (!lastReal) return list[0];

  const i = list.findIndex(p => p.id === lastReal.personId);
  if (i === -1) return list[0]; // they left the family since
  return list[(i + 1) % list.length];
}

/** The next n people after the current one. */
export function getUpcoming(family: Family, n: number): Person[] {
  const list = roster(family);
  const current = getCurrentPerson(family);
  if (!current || list.length === 0) return [];
  const start = list.findIndex(p => p.id === current.id);
  return Array.from({ length: Math.min(n, list.length - 1) },
    (_, k) => list[(start + 1 + k) % list.length]);
}

/** Next occurrence of the scheduled weekday, at or after `from`. */
export function nextToastDate(weekday: number, time: string, from = new Date()): Date {
  const [h, m] = time.split(':').map(Number);
  const d = new Date(from);
  d.setHours(h, m, 0, 0);
  const delta = (weekday - d.getDay() + 7) % 7;
  if (delta === 0 && d <= from) d.setDate(d.getDate() + 7);
  else d.setDate(d.getDate() + delta);
  return d;
}

/** Turns per person over the last `days` days. */
export function turnCounts(family: Family, days = 90): Record<string, number> {
  const cutoff = new Date(Date.now() - days * 86_400_000).toISOString();
  const counts: Record<string, number> = {};
  for (const p of family.people) counts[p.id] = 0;
  for (const t of family.turns) {
    if (!t.skipped && t.madeAt >= cutoff && t.personId in counts) counts[t.personId]++;
  }
  return counts;
}
'@

Write-IfMissing 'src/lib/rotation.test.ts' @'
import { describe, it, expect } from 'vitest';
import { getCurrentPerson, nextToastDate } from './rotation';
import type { Family } from './types';

const person = (id: string, order: number, active = true) =>
  ({ id, name: id, color: '#E9553D', order, active });

const family = (turns: Family['turns'] = []): Family => ({
  id: 'f1', name: 'Test',
  people: [person('a', 0), person('b', 1), person('c', 2)],
  schedule: { weekday: 0, time: '20:00', remind: true },
  turns,
});

describe('getCurrentPerson', () => {
  it('starts with the first person', () => {
    expect(getCurrentPerson(family())?.id).toBe('a');
  });

  it('advances after a logged turn', () => {
    const f = family([{ id: 't1', personId: 'a', madeAt: '2026-08-09', skipped: false }]);
    expect(getCurrentPerson(f)?.id).toBe('b');
  });

  it('wraps around at the end', () => {
    const f = family([{ id: 't1', personId: 'c', madeAt: '2026-08-09', skipped: false }]);
    expect(getCurrentPerson(f)?.id).toBe('a');
  });

  it('does not advance on a skipped week', () => {
    const f = family([
      { id: 't2', personId: 'b', madeAt: '2026-08-16', skipped: true },
      { id: 't1', personId: 'a', madeAt: '2026-08-09', skipped: false },
    ]);
    expect(getCurrentPerson(f)?.id).toBe('b');
  });

  it('skips people on holiday', () => {
    const f = family([{ id: 't1', personId: 'a', madeAt: '2026-08-09', skipped: false }]);
    f.people[1].active = false;
    expect(getCurrentPerson(f)?.id).toBe('c');
  });

  it('returns null for an empty roster', () => {
    const f = family();
    f.people = [];
    expect(getCurrentPerson(f)).toBeNull();
  });
});

describe('nextToastDate', () => {
  it('finds the coming Sunday', () => {
    const wed = new Date('2026-08-19T09:00:00');
    expect(nextToastDate(0, '20:00', wed).getDay()).toBe(0);
  });
});
'@

Write-IfMissing 'vitest.config.ts' @'
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { environment: 'jsdom', globals: true },
});
'@

Write-IfMissing 'docs/README.md' @'
Put the approved prototype here as `prototype.html`.
It is the source of truth for colours, spacing, timings and SVG geometry.
'@

# ----------------------------------------------------------------- scripts ---
Say "npm scripts"
npm pkg set scripts.test="vitest run"    | Out-Null
npm pkg set scripts.test:watch="vitest"  | Out-Null
Note "test, test:watch"

# ------------------------------------------------------------------ verify ---
Say "Running the rotation tests"
npx vitest run src/lib/rotation.test.ts
if ($LASTEXITCODE -ne 0) {
  Write-Host "`nTests failed - check the output above before continuing." -ForegroundColor Red; exit 1
}

Say "Done"
Write-Host @"

Still to do by hand:
  copy CLAUDE.md            to  .\CLAUDE.md
  copy toast-turn-v2.html   to  .\docs\prototype.html

Then:
  git add -A
  git commit -m "chore: scaffold"
  claude

First prompt:
  Read CLAUDE.md and docs/prototype.html, then do Phase 1.
  Start with the Toaster component - port the SVG exactly.
"@ -ForegroundColor Gray
