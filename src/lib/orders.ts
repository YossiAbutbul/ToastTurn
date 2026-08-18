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

/**
 * What it is made on. Sliced bread is what the toaster is for and what an
 * order that never said anything means, so it leads and it is the default.
 * The rest go under the grill or in a pan, which the maker can see at a
 * glance rather than being told.
 */
export const BREADS = ['sliced', 'challah', 'tortilla', 'bun'] as const;
export type Bread = (typeof BREADS)[number];

export const BREAD_DEFAULT: Bread = 'sliced';

/** One slice: what it is, and however its owner wants it dressed. */
export type Slice = { bread: Bread; toppings: Topping[] };

/** A plain slice of ordinary bread, which is what an empty order means. */
export function plainSlice(): Slice {
  return { bread: BREAD_DEFAULT, toppings: [] };
}

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
  const slices = raw.slice(0, SLICE_MAX).map((slice) => ({
    // An order written before there was anything but sliced bread says
    // nothing about it, and meant sliced bread.
    bread: cleanBread((slice as Slice | null)?.bread),
    toppings: cleanToppings((slice as Slice | null)?.toppings),
  }));

  return slices.length > 0 ? slices : [plainSlice()];
}

/** Only what the kitchen actually has. Anything else is ordinary bread. */
export function cleanBread(value: unknown): Bread {
  return BREADS.includes(value as Bread) ? (value as Bread) : BREAD_DEFAULT;
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

/**
 * How many slices this order is asking for.
 *
 * An order is on the board until it is made, and comes off the moment it is:
 * whoever makes it says so once, for the whole order, rather than ticking
 * each slice as they go. So what is left to make is simply what was asked.
 */
export function outstanding(order: Order | null): number {
  return order ? order.slices.length : 0;
}

export type OrderTally = {
  /** Slices still to make, which is what decides how many rounds are left. */
  slices: number;
  /** How much of each bread to get out, so the maker cuts once. */
  breads: Record<Bread, number>;
  /** How many of each thing to get out of the fridge. */
  toppings: Record<Topping, number>;
  /** How many people have actually said, out of how many could. */
  said: number;
  people: number;
};

export function tally(lines: OrderLine[]): OrderTally {
  const toppings = Object.fromEntries(TOPPINGS.map((t) => [t, 0])) as Record<Topping, number>;
  const breads = Object.fromEntries(BREADS.map((b) => [b, 0])) as Record<Bread, number>;
  const counted: OrderTally = { slices: 0, breads, toppings, said: 0, people: lines.length };

  for (const line of lines) {
    if (!line.order) continue;
    counted.said += 1;

    for (const slice of line.order.slices) {
      counted.slices += 1;
      counted.breads[slice.bread] += 1;
      for (const topping of slice.toppings) counted.toppings[topping] += 1;
    }
  }

  return counted;
}
