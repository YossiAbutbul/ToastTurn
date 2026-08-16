import { describe, expect, it } from 'vitest';
import {
  NOTE_MAX,
  SLICE_MAX,
  cleanNote,
  cleanSlices,
  cleanToppings,
  listForFamily,
  orderFor,
  isMade,
  madeFor,
  outstanding,
  tally,
  toggleMade,
} from './orders';
import type { Order, OrderBoard } from './orders';
import type { Family, Person } from './types';

const person = (id: string, order: number, active = true): Person => ({
  id,
  name: id.toUpperCase(),
  color: '#E9553D',
  order,
  active,
});

const family = (people: Person[]): Family => ({
  id: 'fam',
  name: 'The Abutbuls',
  people,
  schedule: { weekday: 0, time: '20:00', remind: true },
  turns: [],
});

const order = (over: Partial<Order> = {}): Order => ({
  personId: 'a',
  slices: [{ toppings: ['cheese'] }, { toppings: [] }],
  updatedAt: '2026-08-16T09:00:00.000Z',
  ...over,
});

const board = (...orders: Order[]): OrderBoard =>
  Object.fromEntries(orders.map((o) => [o.personId, o]));

describe('what everyone wants', () => {
  it('finds what one person asked for', () => {
    expect(orderFor(board(order()), 'a')?.slices).toHaveLength(2);
    expect(orderFor(board(order()), 'b')).toBeNull();
    expect(orderFor(board(order()), undefined)).toBeNull();
  });

  it('ignores a half written order rather than showing nonsense', () => {
    expect(orderFor({ a: null as unknown as Order }, 'a')).toBeNull();
    expect(orderFor({ a: { slices: [] } as unknown as Order }, 'a')).toBeNull();
    expect(orderFor({} as OrderBoard, 'a')).toBeNull();
  });

  it('keeps slices between one and what the toaster will manage', () => {
    expect(cleanSlices([])).toEqual([{ toppings: [] }]);
    expect(cleanSlices(undefined)).toEqual([{ toppings: [] }]);
    expect(cleanSlices('two')).toEqual([{ toppings: [] }]);
    expect(cleanSlices(Array.from({ length: 9 }, () => ({ toppings: [] })))).toHaveLength(SLICE_MAX);
  });

  it('lets one person want two different things', () => {
    const two = cleanSlices([{ toppings: ['cheese'] }, { toppings: ['olives', 'ketchup'] }]);
    expect(two[0].toppings).toEqual(['cheese']);
    expect(two[1].toppings).toEqual(['olives', 'ketchup']);
  });

  it('lists the rotation in its own order, with the choices beside it', () => {
    const lines = listForFamily(board(order({ personId: 'b' })), family([person('b', 1), person('a', 0)]));
    expect(lines.map((line) => line.person.id)).toEqual(['a', 'b']);
    expect(lines[0].order).toBeNull();
    expect(lines[1].order?.personId).toBe('b');
  });

  // Nobody is making toast for someone who is away.
  it('leaves out anyone on holiday', () => {
    const lines = listForFamily({}, family([person('a', 0), person('b', 1, false)]));
    expect(lines.map((line) => line.person.id)).toEqual(['a']);
  });

  it('counts up what the maker actually has to do', () => {
    const lines = listForFamily(
      board(
        order({ personId: 'a', slices: [{ toppings: ['cheese', 'olives'] }, { toppings: ['cheese'] }] }),
        order({ personId: 'b', slices: [{ toppings: [] }] }),
      ),
      family([person('a', 0), person('b', 1), person('c', 2)]),
    );
    const counted = tally(lines);
    expect(counted.slices).toBe(3);
    expect(counted.said).toBe(2);
    expect(counted.people).toBe(3);
    // Cheese on two slices means getting the cheese out for two.
    expect(counted.toppings.cheese).toBe(2);
    expect(counted.toppings.olives).toBe(1);
    expect(counted.toppings.sriracha).toBe(0);
  });

  it('takes only what is on the topping list, once each, in one order', () => {
    expect(cleanToppings(['olives', 'ketchup', 'olives'])).toEqual(['olives', 'ketchup']);
    expect(cleanToppings(['marmite', 'cheese'])).toEqual(['cheese']);
    expect(cleanToppings('cheese')).toEqual([]);
    expect(cleanToppings(undefined)).toEqual([]);
  });

  // An order from before slices existed still has to read as an order.
  it('reads a bare order as one plain slice', () => {
    const older = { personId: 'a', updatedAt: '2026-08-16T09:00:00.000Z' } as unknown as Order;
    expect(orderFor({ a: older }, 'a')?.slices).toEqual([{ toppings: [] }]);
  });

  it('counts only the slices still to make', () => {
    const two = order({ slices: [{ toppings: [] }, { toppings: [] }] });
    expect(outstanding(two)).toBe(2);
    expect(outstanding(two, [1])).toBe(1);
    expect(outstanding(two, [0, 1])).toBe(0);
    expect(outstanding(null, [])).toBe(0);
  });

  // Ticking belongs to whoever is making the toast, not to whoever asked, so
  // it lives on its own board rather than inside somebody else's order.
  it('ticks a slice off and puts it back', () => {
    expect(toggleMade({}, 'a', 1)).toEqual([1]);
    expect(toggleMade({ a: [1] }, 'a', 0)).toEqual([0, 1]);
    expect(toggleMade({ a: [0, 1] }, 'a', 1)).toEqual([0]);
  });

  it('reads a board that arrives with rubbish in it', () => {
    expect(madeFor({ a: [0, 2] }, 'a')).toEqual([0, 2]);
    expect(madeFor({ a: 'all' as unknown as number[] }, 'a')).toEqual([]);
    expect(madeFor({}, 'a')).toEqual([]);
    expect(isMade({ a: [2] }, 'a', 2)).toBe(true);
    expect(isMade({ a: [2] }, 'a', 0)).toBe(false);
  });

  // A made slice stays on the order, so the list still shows what was asked
  // for. It simply stops being work, and stops sending anyone to the fridge.
  it('leaves a made slice out of the count and out of the fridge', () => {
    const lines = listForFamily(
      board(order({ personId: 'a', slices: [{ toppings: ['cheese'] }, { toppings: ['olives'] }] })),
      family([person('a', 0)]),
    );
    const counted = tally(lines, { a: [1] });
    expect(counted.slices).toBe(1);
    expect(counted.said).toBe(1);
    expect(counted.toppings.cheese).toBe(1);
    expect(counted.toppings.olives).toBe(0);
    expect(lines[0].order?.slices).toHaveLength(2);
  });

  it('counts everything when nothing has been ticked', () => {
    const lines = listForFamily(
      board(order({ personId: 'a', slices: [{ toppings: ['cheese'] }, { toppings: ['olives'] }] })),
      family([person('a', 0)]),
    );
    expect(tally(lines).slices).toBe(2);
    expect(tally(lines).toppings.olives).toBe(1);
  });

  it('tidies a note down to something readable', () => {
    expect(cleanNote('  no   crusts  ')).toBe('no crusts');
    expect(cleanNote('x'.repeat(80))).toHaveLength(NOTE_MAX);
    expect(cleanNote('   ')).toBe('');
  });
});
