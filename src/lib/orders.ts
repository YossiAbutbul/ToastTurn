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

/**
 * Which slices have been made, by person.
 *
 * Kept apart from the orders on purpose. An order belongs to the person who
 * asked for it and nobody else may write it, but whoever is making the toast
 * has to tick off everyone's, and they are not always the one who runs the
 * rotation. So the ticks live on a board of their own that anybody in the
 * family may write, the way the swap board does.
 */
export type MadeBoard = Record<string, number[]>;

export function madeFor(board: MadeBoard, personId: string): number[] {
  const made = (board ?? {})[personId];
  return Array.isArray(made) ? made.filter((n) => Number.isInteger(n) && n >= 0) : [];
}

export function isMade(board: MadeBoard, personId: string, index: number): boolean {
  return madeFor(board, personId).includes(index);
}

/** Tick one slice off, or put it back. */
export function toggleMade(board: MadeBoard, personId: string, index: number): number[] {
  const made = madeFor(board, personId);
  return made.includes(index)
    ? made.filter((n) => n !== index)
    : [...made, index].sort((a, b) => a - b);
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

/** What is still to be made, which is all the maker cares about. */
export function outstanding(order: Order | null, made: number[] = []): number {
  if (!order) return 0;
  return order.slices.filter((_, index) => !made.includes(index)).length;
}

export type OrderTally = {
  /** Slices still to make, which is what decides how many rounds are left. */
  slices: number;
  /** How many of each thing to get out of the fridge. */
  toppings: Record<Topping, number>;
  /** How many people have actually said, out of how many could. */
  said: number;
  people: number;
};

export function tally(lines: OrderLine[], board: MadeBoard = {}): OrderTally {
  const toppings = Object.fromEntries(TOPPINGS.map((t) => [t, 0])) as Record<Topping, number>;
  const counted: OrderTally = { slices: 0, toppings, said: 0, people: lines.length };

  for (const line of lines) {
    if (!line.order) continue;
    counted.said += 1;

    // Only what is still to come: a slice already made needs nothing more out
    // of the fridge, and counting it would send the maker back for cheese
    // they have already used.
    const made = madeFor(board, line.person.id);
    line.order.slices.forEach((slice, index) => {
      if (made.includes(index)) return;
      counted.slices += 1;
      for (const topping of slice.toppings) counted.toppings[topping] += 1;
    });
  }

  return counted;
}
