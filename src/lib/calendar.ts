import type { Turn } from './types';

export type Day = {
  /** Day of the month, or null for the blanks before the first. */
  day: number | null;
  /** Turns logged that day, newest first. */
  turns: Turn[];
};

/** The local calendar day a turn belongs to. */
function dayOf(turn: Turn): { year: number; month: number; day: number } {
  const d = new Date(turn.madeAt.length <= 10 ? `${turn.madeAt}T00:00:00` : turn.madeAt);
  return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
}

/**
 * A month laid out in weeks starting Sunday, each day carrying whatever was
 * logged on it. Pure: it takes the month it should draw rather than reading a
 * clock.
 */
export function monthCalendar(date: Date, turns: Turn[]): Day[][] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const length = new Date(year, month + 1, 0).getDate();

  const byDay = new Map<number, Turn[]>();
  for (const turn of turns) {
    const at = dayOf(turn);
    if (at.year !== year || at.month !== month) continue;
    byDay.set(at.day, [...(byDay.get(at.day) ?? []), turn]);
  }

  const cells: Day[] = [
    ...Array.from({ length: firstWeekday }, () => ({ day: null, turns: [] })),
    ...Array.from({ length }, (_, i) => ({ day: i + 1, turns: byDay.get(i + 1) ?? [] })),
  ];
  while (cells.length % 7 !== 0) cells.push({ day: null, turns: [] });

  return Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));
}
