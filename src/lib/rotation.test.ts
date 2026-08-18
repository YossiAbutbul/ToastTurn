import { describe, expect, it } from 'vitest';
import {
  monthRange,
  rotationOrder,
  getCurrentPerson,
  getUpcoming,
  logTurn,
  removeTurn,
  skipWeek,
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

  it('moves the time rather than logging twice on one day', () => {
    const once = logTurn(family(four()), { id: 't1', madeAt: '2026-08-16T08:00:00.000Z' });
    const twice = logTurn(once, { id: 't2', madeAt: '2026-08-16T08:00:30.000Z' });

    expect(twice.turns).toHaveLength(1);
    expect(twice.turns[0]).toMatchObject({ id: 't1', madeAt: '2026-08-16T08:00:30.000Z' });
    expect(getCurrentPerson(twice)?.id).toBe('b');
  });

  it('logs the next day as its own turn', () => {
    const monday = logTurn(family(four()), { id: 't1', madeAt: '2026-08-16T08:00:00.000Z' });
    const tuesday = logTurn(monday, { id: 't2', madeAt: '2026-08-17T08:00:00.000Z' });

    expect(tuesday.turns.map((t) => t.id)).toEqual(['t2', 't1']);
    expect(getCurrentPerson(tuesday)?.id).toBe('c');
  });

  it('records one skip a day however often it is tapped', () => {
    const once = skipWeek(family(four()), { id: 's1', madeAt: '2026-08-16T08:00:00.000Z' });
    const twice = skipWeek(once, { id: 's2', madeAt: '2026-08-16T09:00:00.000Z' });
    expect(twice.turns).toHaveLength(1);
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

describe('removeTurn', () => {
  it('hands the rotation back to whoever was up before it', () => {
    const made = family(four(), [turn('t1', 'a', '2026-08-16')]);
    expect(getCurrentPerson(made)?.id).toBe('b');
    expect(getCurrentPerson(removeTurn(made, 't1'))?.id).toBe('a');
  });

  it('leaves the rest of the log alone', () => {
    const twice = family(four(), [turn('t2', 'b', '2026-08-16'), turn('t1', 'a', '2026-08-09')]);
    expect(removeTurn(twice, 't2').turns.map((t) => t.id)).toEqual(['t1']);
  });

  it('remembers the removal, so the other phones cannot hand it back', () => {
    const made = family(four(), [turn('t1', 'a', '2026-08-16')]);
    expect(removeTurn(made, 't1').removed).toEqual(['t1']);
  });
});

describe('monthRange', () => {
  it('covers the month a date falls in', () => {
    expect(monthRange(new Date(2026, 7, 16))).toEqual({ from: '2026-08-01', to: '2026-09-01' });
  });

  it('rolls over the year end', () => {
    expect(monthRange(new Date(2026, 11, 3))).toEqual({ from: '2026-12-01', to: '2027-01-01' });
  });

  it('counts a turn logged late on the last day of the month', () => {
    const { from, to } = monthRange(new Date(2026, 7, 16));
    const lastMoment = '2026-08-31T23:59:00.000Z';
    expect(lastMoment >= from && lastMoment < to).toBe(true);
  });
});

describe('rotationOrder', () => {
  it('starts with whoever is up and runs to the end of the queue', () => {
    expect(rotationOrder(family(four())).map((p) => p.id)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('moves the person who just made toast to the back', () => {
    const after = logTurn(family(four()), { id: 't1', madeAt: '2026-08-16' });
    expect(rotationOrder(after).map((p) => p.id)).toEqual(['b', 'c', 'd', 'a']);
  });

  it('leaves out anyone on holiday', () => {
    const holiday = family([person('a', 0), person('b', 1, false), person('c', 2)]);
    expect(rotationOrder(holiday).map((p) => p.id)).toEqual(['a', 'c']);
  });

  it('is empty when nobody is in the rotation', () => {
    expect(rotationOrder(family([]))).toEqual([]);
  });
});
