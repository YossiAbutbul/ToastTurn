import { describe, expect, it } from 'vitest';
import {
  getCurrentPerson,
  getUpcoming,
  logTurn,
  nextToastDate,
  skipWeek,
  swapPeople,
  turnCounts,
} from './rotation';
import type { Family, Person, Turn } from './types';

const person = (id: string, order: number, active = true): Person => ({
  id,
  name: id.toUpperCase(),
  color: '#E9553D',
  order,
  active,
});

const turn = (id: string, personId: string, madeAt: string, skipped = false): Turn => ({
  id,
  personId,
  madeAt,
  skipped,
});

const family = (people: Person[], turns: Turn[] = []): Family => ({
  id: 'fam',
  name: 'Test',
  people,
  schedule: { weekday: 0, time: '20:00', remind: true },
  turns,
});

const four = () => [person('a', 0), person('b', 1), person('c', 2), person('d', 3)];

describe('getCurrentPerson', () => {
  it('returns null for an empty family', () => {
    expect(getCurrentPerson(family([]))).toBeNull();
  });

  it('returns null when everyone is inactive', () => {
    expect(getCurrentPerson(family([person('a', 0, false), person('b', 1, false)]))).toBeNull();
  });

  it('always returns the same person when there is only one', () => {
    const solo = family([person('a', 0)], [turn('t1', 'a', '2026-08-09')]);
    expect(getCurrentPerson(solo)?.id).toBe('a');
  });

  it('starts at the first person in order when nothing has been logged', () => {
    expect(getCurrentPerson(family(four()))?.id).toBe('a');
  });

  it('follows rotation order, not the order people were added', () => {
    const shuffled = family([person('a', 3), person('b', 0), person('c', 1), person('d', 2)]);
    expect(getCurrentPerson(shuffled)?.id).toBe('b');
  });

  it('moves on after a credited turn, and wraps at the end', () => {
    const after = family(four(), [turn('t1', 'a', '2026-08-09')]);
    expect(getCurrentPerson(after)?.id).toBe('b');

    const wrapped = family(four(), [turn('t2', 'd', '2026-08-16'), turn('t1', 'a', '2026-08-09')]);
    expect(getCurrentPerson(wrapped)?.id).toBe('a');
  });

  it('does not advance for a skipped turn', () => {
    const skipped = family(four(), [turn('t1', 'a', '2026-08-09', true)]);
    expect(getCurrentPerson(skipped)?.id).toBe('a');
  });

  it('does not advance for a run of skipped weeks after a credited one', () => {
    const mixed = family(four(), [
      turn('t3', 'b', '2026-08-16', true),
      turn('t2', 'b', '2026-08-09', true),
      turn('t1', 'a', '2026-08-02'),
    ]);
    expect(getCurrentPerson(mixed)?.id).toBe('b');
  });

  it('skips people who are on holiday', () => {
    const holiday = family(
      [person('a', 0), person('b', 1, false), person('c', 2), person('d', 3)],
      [turn('t1', 'a', '2026-08-09')],
    );
    expect(getCurrentPerson(holiday)?.id).toBe('c');
  });

  it('falls back to the last turn by someone still in the rotation', () => {
    const gone = family(
      [person('a', 0), person('c', 2)],
      [turn('t2', 'b', '2026-08-16'), turn('t1', 'a', '2026-08-09')],
    );
    expect(getCurrentPerson(gone)?.id).toBe('c');
  });

  it('reads the newest turn even when the log arrives out of order', () => {
    const unsorted = family(four(), [turn('t1', 'a', '2026-08-02'), turn('t2', 'b', '2026-08-09')]);
    expect(getCurrentPerson(unsorted)?.id).toBe('c');
  });
});

describe('getUpcoming', () => {
  it('lists the queue after the current person, wrapping', () => {
    expect(getUpcoming(family(four()), 3).map((p) => p.id)).toEqual(['b', 'c', 'd']);
  });

  it('never repeats the current person, even when asked for more than exist', () => {
    expect(getUpcoming(family(four()), 10).map((p) => p.id)).toEqual(['b', 'c', 'd']);
  });

  it('is empty for a one-person family', () => {
    expect(getUpcoming(family([person('a', 0)]), 3)).toEqual([]);
  });

  it('is empty for an empty family', () => {
    expect(getUpcoming(family([]), 3)).toEqual([]);
  });
});

describe('logTurn and skipWeek', () => {
  it('credits the current person and advances', () => {
    const next = logTurn(family(four()), { id: 't1', madeAt: '2026-08-16' });
    expect(next.turns[0]).toMatchObject({ personId: 'a', skipped: false });
    expect(getCurrentPerson(next)?.id).toBe('b');
  });

  it('records a skip without moving the rotation', () => {
    const next = skipWeek(family(four()), { id: 't1', madeAt: '2026-08-16' });
    expect(next.turns[0]).toMatchObject({ personId: 'a', skipped: true });
    expect(getCurrentPerson(next)?.id).toBe('a');
  });

  it('leaves an empty family alone', () => {
    const empty = family([]);
    expect(logTurn(empty, { id: 't1', madeAt: '2026-08-16' })).toBe(empty);
  });

  it('caps the local log at 200 turns', () => {
    const many = Array.from({ length: 200 }, (_, i) => turn(`t${i}`, 'a', '2026-01-01'));
    const next = logTurn(family(four(), many), { id: 'new', madeAt: '2026-08-16' });
    expect(next.turns).toHaveLength(200);
    expect(next.turns[0].id).toBe('new');
  });
});

describe('swapPeople', () => {
  it('trades rotation positions', () => {
    const swapped = swapPeople(family(four()), 'a', 'c');
    expect(getCurrentPerson(swapped)?.id).toBe('c');
    expect(getUpcoming(swapped, 3).map((p) => p.id)).toEqual(['b', 'a', 'd']);
  });

  it('ignores unknown people and self-swaps', () => {
    const base = family(four());
    expect(swapPeople(base, 'a', 'a')).toBe(base);
    expect(swapPeople(base, 'a', 'nope')).toBe(base);
  });
});

describe('turnCounts', () => {
  it('counts credited turns per person and ignores skips', () => {
    const counted = family(four(), [
      turn('t3', 'b', '2026-08-16'),
      turn('t2', 'a', '2026-08-09', true),
      turn('t1', 'a', '2026-08-02'),
    ]);
    expect(turnCounts(counted)).toEqual({ a: 1, b: 1, c: 0, d: 0 });
  });

  it('honours a date range', () => {
    const counted = family(four(), [
      turn('t2', 'a', '2026-08-16'),
      turn('t1', 'a', '2026-07-05'),
    ]);
    expect(turnCounts(counted, { from: '2026-08-01' })).toEqual({ a: 1, b: 0, c: 0, d: 0 });
  });
});

describe('nextToastDate', () => {
  const sunday8pm = { weekday: 0, time: '20:00', remind: true };

  it('finds the coming weekday', () => {
    // Sat 15 Aug 2026, 10:00 → Sun 16 Aug, 20:00
    const next = nextToastDate(sunday8pm, new Date(2026, 7, 15, 10, 0));
    expect(next.getTime()).toBe(new Date(2026, 7, 16, 20, 0).getTime());
  });

  it('keeps today when the time has not passed yet', () => {
    const next = nextToastDate(sunday8pm, new Date(2026, 7, 16, 9, 0));
    expect(next.getTime()).toBe(new Date(2026, 7, 16, 20, 0).getTime());
  });

  it('jumps a full week once the time has passed', () => {
    const next = nextToastDate(sunday8pm, new Date(2026, 7, 16, 20, 30));
    expect(next.getTime()).toBe(new Date(2026, 7, 23, 20, 0).getTime());
  });
});
