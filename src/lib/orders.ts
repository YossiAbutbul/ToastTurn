import type { Family, Person } from './types';

/**
 * What everyone wants, so whoever is making it only has to look once.
 *
 * The board is keyed by person rather than by account, because half a family
 * has no phone of its own: the owner can put an order in for a child, and the
 * rules still hold everyone else to their own line.
 */

/** What can go on it. A fixed list, so the maker never has to interpret. */
export const TOPPINGS = ['cheese', 'bulgarian', 'tomatoes', 'olives', 'ketchup', 'sriracha'] as const;
export type Topping = (typeof TOPPINGS)[number];

/** One slice, dressed however its owner wants it. */
export type Slice = { toppings: Topping[] };

export type Order = {
  personId: string;
  /** One entry per slice, so two slices can be two different things. */
  slices: Slice[];
  /** Anything the toaster cannot express. Kept short on purpose. */
  note?: string;
  updatedAt: string;
};

export type OrderBoard = Record<string, Order>;

/** Nobody in this family is having four, and each one is its own slice. */
export const SLICE_MAX = 3;

/** Long enough for "no crusts", short enough to read at a glance. */
export const NOTE_MAX = 40;

export function cleanNote(text: string): string {
  return text.replace(/\s+/g, ' ').trim().slice(0, NOTE_MAX);
}

function isOrder(value: unknown): value is Order {
  // Written as a null check rather than Boolean(), which does not narrow.
  const order = value as Order | null;
  return order != null && typeof order.personId === 'string';
}

/**
 * Slices as they come back from another phone: at least one, never more than
 * the toaster is going to manage, and each dressed only from the list.
 */
export function cleanSlices(value: unknown): Slice[] {
  const raw = Array.isArray(value) ? value : [];
  const slices = raw
    .slice(0, SLICE_MAX)
    .map((slice) => ({ toppings: cleanToppings((slice as Slice | null)?.toppings) }));

  return slices.length > 0 ? slices : [{ toppings: [] }];
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
  return { ...order, slices: cleanSlices(order.slices) };
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
  /** Slices in total, which is what decides how many rounds it takes. */
  slices: number;
  /** How many of each thing to get out of the fridge. */
  toppings: Record<Topping, number>;
  /** How many people have actually said, out of how many could. */
  said: number;
  people: number;
};

export function tally(lines: OrderLine[]): OrderTally {
  const toppings = Object.fromEntries(TOPPINGS.map((t) => [t, 0])) as Record<Topping, number>;
  const counted: OrderTally = { slices: 0, toppings, said: 0, people: lines.length };

  for (const line of lines) {
    if (!line.order) continue;
    counted.said += 1;
    counted.slices += line.order.slices.length;
    // A thing is counted once for every slice it goes on: two slices with
    // cheese means getting the cheese out for two.
    for (const slice of line.order.slices) {
      for (const topping of slice.toppings) counted.toppings[topping] += 1;
    }
  }

  return counted;
}
