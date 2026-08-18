import { describe, expect, it } from 'vitest';
import {
  NOTE_MAX,
  SLICE_MAX,
  cleanBread,
  cleanNote,
  cleanSlices,
  cleanToppings,
  listForFamily,
  orderFor,
  outstanding,
  plainSlice,
  tally,
} from './orders';
import type { Order, OrderBoard, Slice, Topping } from './orders';
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
  turns: [],
});

/** A slice on ordinary bread, for the tests that are about what goes on top. */
const on = (...toppings: Topping[]): Slice => ({ bread: 'sliced', toppings });

const order = (over: Partial<Order> = {}): Order => ({
  personId: 'a',
  slices: [on('cheese'), on()],
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
    expect(cleanSlices([])).toEqual([plainSlice()]);
    expect(cleanSlices(undefined)).toEqual([plainSlice()]);
    expect(cleanSlices('two')).toEqual([plainSlice()]);
    expect(cleanSlices(Array.from({ length: 9 }, () => on()))).toHaveLength(SLICE_MAX);
  });

  it('takes only bread the kitchen has, and reads silence as sliced', () => {
    expect(cleanBread('challah')).toBe('challah');
    expect(cleanBread('brioche')).toBe('sliced');
    expect(cleanBread(undefined)).toBe('sliced');
    // An order written before there was a choice never said, and meant sliced.
    expect(cleanSlices([{ toppings: ['cheese'] }])[0].bread).toBe('sliced');
  });

  it('keeps two slices on two different breads', () => {
    const two = cleanSlices([
      { bread: 'challah', toppings: [] },
      { bread: 'tortilla', toppings: ['cheese'] },
    ]);
    expect(two.map((slice) => slice.bread)).toEqual(['challah', 'tortilla']);
  });

  it('counts the bread to get out, not just the slices', () => {
    const lines = listForFamily(
      board(
        order({
          personId: 'a',
          slices: [{ bread: 'challah', toppings: [] }, on('cheese')],
        }),
      ),
      family([person('a', 0)]),
    );
    const counted = tally(lines);
    expect(counted.breads.challah).toBe(1);
    expect(counted.breads.sliced).toBe(1);
    expect(counted.breads.bun).toBe(0);
  });

  it('lets one person want two different things', () => {
    const two = cleanSlices([on('cheese'), on('olives', 'ketchup')]);
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
        order({ personId: 'a', slices: [on('cheese', 'olives'), on('cheese')] }),
        order({ personId: 'b', slices: [on()] }),
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
    expect(orderFor({ a: older }, 'a')?.slices).toEqual([plainSlice()]);
  });

  // An order is on the board until it is made, and comes off when it is, so
  // what is left to make is simply what was asked for.
  it('counts what the order asks for', () => {
    expect(outstanding(order({ slices: [on(), on()] }))).toBe(2);
    expect(outstanding(order({ slices: [on()] }))).toBe(1);
    expect(outstanding(null)).toBe(0);
  });

  it('counts every slice on the board', () => {
    const lines = listForFamily(
      board(order({ personId: 'a', slices: [on('cheese'), on('olives')] })),
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
