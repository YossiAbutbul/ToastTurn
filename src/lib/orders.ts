import type { Family, Person } from './types';

/**
 * What everyone wants, so whoever is making it only has to look once.
 *
 * The board is keyed by person rather than by account, because half a family
 * has no phone of its own: the owner can put an order in for a child, and the
 * rules still hold everyone else to their own line.
 */

export type Toastiness = 'light' | 'medium' | 'dark';

/** What can go on it. A fixed list, so the maker never has to interpret. */
export const TOPPINGS = ['cheese', 'bulgarian', 'tomatoes', 'olives', 'ketchup', 'sriracha'] as const;
export type Topping = (typeof TOPPINGS)[number];

export type Order = {
  personId: string;
  toastiness: Toastiness;
  toppings: Topping[];
  /** Anything the toaster cannot express. Kept short on purpose. */
  note?: string;
  updatedAt: string;
};

export type OrderBoard = Record<string, Order>;

export const TOASTINESS: Toastiness[] = ['light', 'medium', 'dark'];

/** Long enough for "no crusts", short enough to read at a glance. */
export const NOTE_MAX = 40;

export function cleanNote(text: string): string {
  return text.replace(/\s+/g, ' ').trim().slice(0, NOTE_MAX);
}

function isOrder(value: unknown): value is Order {
  const order = value as Order | null;
  return (
    Boolean(order) && typeof order.personId === 'string' && TOASTINESS.includes(order.toastiness)
  );
}

/** Only what is on the list, and each of them once. */
export function cleanToppings(value: unknown): Topping[] {
  if (!Array.isArray(value)) return [];
  const kept = new Set<Topping>();
  for (const item of value) {
    if (TOPPINGS.includes(item as Topping)) kept.add(item as Topping);
  }
  return TOPPINGS.filter((topping) => kept.has(topping));
}

export function orderFor(board: OrderBoard, personId: string | undefined): Order | null {
  if (!personId) return null;
  const order = (board ?? {})[personId];
  if (!isOrder(order)) return null;
  return { ...order, toppings: cleanToppings(order.toppings) };
}

export type OrderLine = { person: Person; order: Order | null };

/**
 * The rotation's own order, with everyone's choice beside them. People on
 * holiday are left out: nobody is making toast for someone who is away.
 */
export function listForFamily(board: OrderBoard, family: Family): OrderLine[] {
  return [...family.people]
    .filter((person) => person.active)
    .sort((a, b) => a.order - b.order)
    .map((person) => ({ person, order: orderFor(board, person.id) }));
}

export type OrderTally = {
  light: number;
  medium: number;
  dark: number;
  /** How many of each thing to get out of the fridge. */
  toppings: Record<Topping, number>;
  /** How many people have actually said, out of how many could. */
  said: number;
  people: number;
};

export function tally(lines: OrderLine[]): OrderTally {
  const toppings = Object.fromEntries(TOPPINGS.map((t) => [t, 0])) as Record<Topping, number>;
  const counted: OrderTally = { light: 0, medium: 0, dark: 0, toppings, said: 0, people: lines.length };

  for (const line of lines) {
    if (!line.order) continue;
    counted.said += 1;
    counted[line.order.toastiness] += 1;
    for (const topping of line.order.toppings) counted.toppings[topping] += 1;
  }

  return counted;
}
