import type { Family } from './types';

const FAMILY_KEY = 'toastturn.family.v1';
const INSTALL_HINT_KEY = 'toastturn.installHint.v1';

/**
 * The only module that touches localStorage. Every read is defensive: a phone
 * with storage disabled still has to show whose turn it is.
 */
function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Private mode or a full quota. The app keeps working in memory.
  }
}

export function loadFamily(): Family | null {
  const raw = read(FAMILY_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Family;
    if (!parsed?.id || !Array.isArray(parsed.people) || !Array.isArray(parsed.turns)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveFamily(family: Family): void {
  write(FAMILY_KEY, JSON.stringify(family));
}

/** The add-to-home-screen hint is offered once and then never again. */
export function installHintDismissed(): boolean {
  return read(INSTALL_HINT_KEY) === 'dismissed';
}

export function dismissInstallHint(): void {
  write(INSTALL_HINT_KEY, 'dismissed');
}

export function clearFamily(): void {
  try {
    window.localStorage.removeItem(FAMILY_KEY);
  } catch {
    // Nothing to do, there was nothing to clear.
  }
}
