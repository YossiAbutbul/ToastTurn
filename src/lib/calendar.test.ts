import { describe, expect, it } from 'vitest';
import { monthCalendar } from './calendar';
import type { Turn } from './types';

const turn = (id: string, personId: string, madeAt: string, skipped = false): Turn => ({
  id,
  personId,
  madeAt,
  skipped,
});

describe('monthCalendar', () => {
  it('starts the month on the right weekday', () => {
    // 1 Aug 2026 is a Saturday, so the first row is six blanks then the 1st.
    const weeks = monthCalendar(new Date(2026, 7, 16), []);
    expect(weeks[0].map((d) => d.day)).toEqual([null, null, null, null, null, null, 1]);
  });

  it('covers every day of the month and pads the last week', () => {
    const weeks = monthCalendar(new Date(2026, 7, 16), []);
    const days = weeks.flat().filter((d) => d.day !== null);
    expect(days).toHaveLength(31);
    expect(weeks.every((week) => week.length === 7)).toBe(true);
  });

  it('drops a turn on the day it was made', () => {
    const weeks = monthCalendar(new Date(2026, 7, 1), [turn('t1', 'p1', '2026-08-09T08:30:00')]);
    const ninth = weeks.flat().find((d) => d.day === 9);
    expect(ninth?.turns.map((t) => t.id)).toEqual(['t1']);
  });

  it('ignores turns from other months', () => {
    const weeks = monthCalendar(new Date(2026, 7, 1), [turn('t1', 'p1', '2026-07-30T08:00:00')]);
    expect(weeks.flat().every((d) => d.turns.length === 0)).toBe(true);
  });

  it('keeps both when two turns land on one day', () => {
    const weeks = monthCalendar(new Date(2026, 7, 1), [
      turn('t1', 'p1', '2026-08-09T08:00:00'),
      turn('t2', 'p2', '2026-08-09T19:00:00'),
    ]);
    expect(weeks.flat().find((d) => d.day === 9)?.turns).toHaveLength(2);
  });
});
