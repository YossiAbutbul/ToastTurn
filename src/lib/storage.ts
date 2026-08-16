import type { Family } from './types';

const FAMILY_KEY = 'toastturn.family.v1';
const FAMILIES_KEY = 'toastturn.families.v1';
const INSTALL_HINT_KEY = 'toastturn.installHint.v1';
const ORDERS_KEY = 'toastturn.orders.v1';

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

/**
 * What everyone wants, on a phone with no keys. With sync on, the board lives
 * beside the family instead and this is never read.
 */
export function loadOrders(familyId: string): Record<string, unknown> {
  const all = parse(read(ORDERS_KEY));
  const board = (all as Record<string, unknown> | null)?.[familyId];
  return board && typeof board === 'object' ? (board as Record<string, unknown>) : {};
}

export function saveOrders(familyId: string, board: Record<string, unknown>): void {
  const all = (parse(read(ORDERS_KEY)) as Record<string, unknown> | null) ?? {};
  write(ORDERS_KEY, JSON.stringify({ ...all, [familyId]: board }));
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
    window.localStorage.removeItem(ORDERS_KEY);
  } catch {
    // Nothing to do, there was nothing to clear.
  }
}
