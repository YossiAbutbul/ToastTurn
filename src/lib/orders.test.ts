import { describe, expect, it } from 'vitest';
import { NOTE_MAX, cleanNote, cleanToppings, listForFamily, orderFor, tally } from './orders';
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
  toastiness: 'dark',
  toppings: ['cheese'],
  updatedAt: '2026-08-16T09:00:00.000Z',
  ...over,
});

const board = (...orders: Order[]): OrderBoard =>
  Object.fromEntries(orders.map((o) => [o.personId, o]));

describe('what everyone wants', () => {
  it('finds what one person asked for', () => {
    expect(orderFor(board(order()), 'a')?.toastiness).toBe('dark');
    expect(orderFor(board(order()), 'b')).toBeNull();
    expect(orderFor(board(order()), undefined)).toBeNull();
  });

  it('ignores a half written order rather than showing nonsense', () => {
    const rubbish = { personId: 'a', toastiness: 'burnt' } as unknown as Order;
    expect(orderFor({ a: rubbish }, 'a')).toBeNull();
    expect(orderFor({} as OrderBoard, 'a')).toBeNull();
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
        order({ personId: 'a', toastiness: 'dark', toppings: ['cheese', 'olives'] }),
        order({ personId: 'b', toastiness: 'light', toppings: ['cheese'] }),
      ),
      family([person('a', 0), person('b', 1), person('c', 2)]),
    );
    const counted = tally(lines);
    expect({ light: counted.light, medium: counted.medium, dark: counted.dark, said: counted.said, people: counted.people })
      .toEqual({ light: 1, medium: 0, dark: 1, said: 2, people: 3 });
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

  // An order written before toppings existed still has to read as an order.
  it('reads an order with no toppings on it as plain', () => {
    const older = { personId: 'a', toastiness: 'medium', updatedAt: '2026-08-16T09:00:00.000Z' } as unknown as Order;
    expect(orderFor({ a: older }, 'a')?.toppings).toEqual([]);
  });

  it('tidies a note down to something readable', () => {
    expect(cleanNote('  no   crusts  ')).toBe('no crusts');
    expect(cleanNote('x'.repeat(80))).toHaveLength(NOTE_MAX);
    expect(cleanNote('   ')).toBe('');
  });
});
