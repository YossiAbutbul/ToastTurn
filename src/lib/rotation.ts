import { REMOVED_CAP, TURN_CAP } from './types';
import type { Family, Person, Turn } from './types';

/** Everyone still in the rotation, in rotation order. */
export function activePeople(family: Family): Person[] {
  return family.people.filter((p) => p.active).sort((a, b) => a.order - b.order);
}

export function getPerson(family: Family, id: string): Person | undefined {
  return family.people.find((p) => p.id === id);
}

/** Turns that count, newest first. Sorted defensively, a synced turn may arrive late. */
function credited(family: Family): Turn[] {
  return family.turns.filter((t) => !t.skipped).sort((a, b) => b.madeAt.localeCompare(a.madeAt));
}

/**
 * Whose turn it is. Derived every time from the turn log, never stored, so two
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

/**
 * Everyone active, in order, starting with whoever is up. Logging a turn moves
 * the rotation on, so the person who just made toast falls to the end by
 * itself, no reordering anywhere.
 */
export function rotationOrder(family: Family): Person[] {
  const roster = activePeople(family);
  const current = getCurrentPerson(family);
  if (!current) return [];

  const start = roster.findIndex((p) => p.id === current.id);
  return roster.map((_, i) => roster[(start + i) % roster.length]);
}

/** An ISO date or timestamp as a Date, in local time either way. */
function at(iso: string): Date {
  return new Date(iso.length <= 10 ? `${iso}T00:00:00` : iso);
}

function withTurn(family: Family, turn: Turn): Family {
  return { ...family, turns: [turn, ...family.turns].slice(0, TURN_CAP) };
}

/**
 * The calendar day a turn belongs to, on the phone reading it. Slicing the ISO
 * string would use UTC, which files a late-night pull under the day before
 * anywhere ahead of it, and the calendar groups by the phone's own days.
 */
function dayPart(iso: string): string {
  const day = at(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`;
}

/**
 * Credit the current person and move the rotation on.
 *
 * Toast gets made once a day. A second pull on the same day is somebody
 * leaning on the lever, not the next person's turn coming early, so it moves
 * the time on the turn already logged rather than logging another and marching
 * the rotation forward.
 */
export function logTurn(family: Family, turn: { id: string; madeAt: string; personId?: string }): Family {
  const personId = turn.personId ?? getCurrentPerson(family)?.id;
  if (!personId) return family;

  const today = dayPart(turn.madeAt);
  const already = family.turns.find((t) => !t.skipped && dayPart(t.madeAt) === today);
  if (already) {
    return {
      ...family,
      turns: family.turns.map((t) => (t.id === already.id ? { ...t, madeAt: turn.madeAt } : t)),
    };
  }

  return withTurn(family, { id: turn.id, personId, madeAt: turn.madeAt, skipped: false });
}

/**
 * Take a turn back off the board, for the pull that was somebody leaning on
 * the lever. The rotation is derived from what is left, so removing the newest
 * turn hands it back to whoever was up before it.
 */
export function removeTurn(family: Family, turnId: string): Family {
  return {
    ...family,
    turns: family.turns.filter((turn) => turn.id !== turnId),
    // Remembered, or the other phones would hand it straight back.
    removed: [turnId, ...(family.removed ?? []).filter((id) => id !== turnId)].slice(0, REMOVED_CAP),
  };
}

/** Record a week nobody made toast. The rotation stays where it is. */
export function skipWeek(family: Family, turn: { id: string; madeAt: string; personId?: string }): Family {
  const personId = turn.personId ?? getCurrentPerson(family)?.id;
  if (!personId) return family;

  // Saying it twice is still the one week nobody made toast.
  const today = dayPart(turn.madeAt);
  if (family.turns.some((t) => t.skipped && dayPart(t.madeAt) === today)) return family;

  return withTurn(family, { id: turn.id, personId, madeAt: turn.madeAt, skipped: true });
}

/** Credited turns per person, optionally inside an ISO range, end exclusive. */
export function turnCounts(family: Family, range?: { from?: string; to?: string }): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const person of family.people) counts[person.id] = 0;

  for (const turn of credited(family)) {
    if (range?.from && turn.madeAt < range.from) continue;
    if (range?.to && turn.madeAt >= range.to) continue;
    if (turn.personId in counts) counts[turn.personId] += 1;
  }
  return counts;
}

/**
 * The ISO range covering the month a date falls in, for counting turns. The
 * end is the first moment of the next month, so a turn logged at 23:59 on the
 * last day still counts, comparisons on ISO strings are exclusive of it.
 */
export function monthRange(date: Date): { from: string; to: string } {
  const pad = (n: number) => String(n).padStart(2, '0');
  const from = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-01`;
  const next = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  const to = `${next.getFullYear()}-${pad(next.getMonth() + 1)}-01`;
  return { from, to };
}

/** The most recent credited turn for a person, if there is one. */
export function lastTurnFor(family: Family, personId: string): Turn | undefined {
  return credited(family).find((t) => t.personId === personId);
}
