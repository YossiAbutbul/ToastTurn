import type { Family } from './types';

const FAMILY_KEY = 'toastturn.family.v1';
const FAMILIES_KEY = 'toastturn.families.v1';
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

function parse(raw: string | null): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function isFamily(value: unknown): value is Family {
  const family = value as Family | null;
  return Boolean(family?.id) && Array.isArray(family?.people) && Array.isArray(family?.turns);
}

/**
 * Every rotation this phone holds, the open one first. A phone from before
 * rotations could be plural keeps its one, it is simply the only entry.
 */
export function loadFamilies(): Family[] {
  const list = parse(read(FAMILIES_KEY));
  if (Array.isArray(list)) return list.filter(isFamily);

  const one = parse(read(FAMILY_KEY));
  return isFamily(one) ? [one] : [];
}

export function saveFamilies(families: Family[]): void {
  write(FAMILIES_KEY, JSON.stringify(families));
}

/** The add-to-home-screen hint is offered once and then never again. */
export function installHintDismissed(): boolean {
  return read(INSTALL_HINT_KEY) === 'dismissed';
}

export function dismissInstallHint(): void {
  write(INSTALL_HINT_KEY, 'dismissed');
}

export function clearFamilies(): void {
  try {
    window.localStorage.removeItem(FAMILIES_KEY);
    window.localStorage.removeItem(FAMILY_KEY);
  } catch {
    // Nothing to do, there was nothing to clear.
  }
}
