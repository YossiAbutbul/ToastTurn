import { TURN_CAP } from './types';
import type { Family, Person, Schedule, Turn } from './types';

/** Everyone still in the rotation, in rotation order. */
export function activePeople(family: Family): Person[] {
  return family.people.filter((p) => p.active).sort((a, b) => a.order - b.order);
}

export function getPerson(family: Family, id: string): Person | undefined {
  return family.people.find((p) => p.id === id);
}

/** Turns that count, newest first. Sorted defensively — a synced turn may arrive late. */
function credited(family: Family): Turn[] {
  return family.turns.filter((t) => !t.skipped).sort((a, b) => b.madeAt.localeCompare(a.madeAt));
}

/**
 * Whose turn it is. Derived every time from the turn log — never stored, so two
 * phones writing at once can't drift apart.
 */
export function getCurrentPerson(family: Family): Person | null {
  const roster = activePeople(family);
  if (roster.length === 0) return null;

  // The most recent credited turn by someone who is still in the rotation.
  for (const turn of credited(family)) {
    const i = roster.findIndex((p) => p.id === turn.personId);
    if (i !== -1) return roster[(i + 1) % roster.length];
  }
  return roster[0];
}

/** The next `n` people after the current one, wrapping, current excluded. */
export function getUpcoming(family: Family, n: number): Person[] {
  const roster = activePeople(family);
  const current = getCurrentPerson(family);
  if (!current || roster.length < 2) return [];

  const start = roster.findIndex((p) => p.id === current.id);
  const count = Math.min(n, roster.length - 1);
  return Array.from({ length: count }, (_, i) => roster[(start + 1 + i) % roster.length]);
}

/** The next time the toast is due, strictly after `from`. */
export function nextToastDate(schedule: Schedule, from: Date): Date {
  const [hours, minutes] = schedule.time.split(':').map(Number);
  const next = new Date(from);
  next.setHours(hours, minutes, 0, 0);

  let ahead = (schedule.weekday - next.getDay() + 7) % 7;
  if (ahead === 0 && next.getTime() <= from.getTime()) ahead = 7;
  next.setDate(next.getDate() + ahead);
  return next;
}

function withTurn(family: Family, turn: Turn): Family {
  return { ...family, turns: [turn, ...family.turns].slice(0, TURN_CAP) };
}

/** Credit the current person and move the rotation on. */
export function logTurn(family: Family, turn: { id: string; madeAt: string; personId?: string }): Family {
  const personId = turn.personId ?? getCurrentPerson(family)?.id;
  if (!personId) return family;
  return withTurn(family, { id: turn.id, personId, madeAt: turn.madeAt, skipped: false });
}

/** Record a week nobody made toast. The rotation stays where it is. */
export function skipWeek(family: Family, turn: { id: string; madeAt: string; personId?: string }): Family {
  const personId = turn.personId ?? getCurrentPerson(family)?.id;
  if (!personId) return family;
  return withTurn(family, { id: turn.id, personId, madeAt: turn.madeAt, skipped: true });
}

/** Trade places in the rotation. */
export function swapPeople(family: Family, aId: string, bId: string): Family {
  const a = getPerson(family, aId);
  const b = getPerson(family, bId);
  if (!a || !b || aId === bId) return family;

  return {
    ...family,
    people: family.people.map((p) =>
      p.id === aId ? { ...p, order: b.order } : p.id === bId ? { ...p, order: a.order } : p,
    ),
  };
}

/** Credited turns per person, optionally inside an ISO date range. */
export function turnCounts(family: Family, range?: { from?: string; to?: string }): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const person of family.people) counts[person.id] = 0;

  for (const turn of credited(family)) {
    if (range?.from && turn.madeAt < range.from) continue;
    if (range?.to && turn.madeAt > range.to) continue;
    if (turn.personId in counts) counts[turn.personId] += 1;
  }
  return counts;
}

/** The most recent credited turn for a person, if there is one. */
export function lastTurnFor(family: Family, personId: string): Turn | undefined {
  return credited(family).find((t) => t.personId === personId);
}
