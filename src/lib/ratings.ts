import type { Turn } from './types';

export type Verdict = { average: number; votes: number } | null;

/**
 * What the family made of a turn. Ratings are per account; a turn carrying the
 * older single `rating` counts as one vote, so nothing logged before this is
 * lost.
 */
export function verdict(turn: Turn): Verdict {
  const votes = Object.values(turn.ratings ?? {});
  if (turn.ratings === undefined && typeof turn.rating === 'number') {
    return { average: turn.rating, votes: 1 };
  }
  if (votes.length === 0) return null;

  const total = votes.reduce((sum, v) => sum + v, 0);
  return { average: total / votes.length, votes: votes.length };
}

/** What the rest of the family made of it, leaving your own vote out. */
export function othersVerdict(turn: Turn, uid: string | undefined): Verdict {
  const entries = Object.entries(turn.ratings ?? {}).filter(([who]) => who !== uid);
  if (entries.length === 0) {
    // A turn rated before ratings were per person belongs to nobody in
    // particular, so it counts as somebody else's.
    return turn.ratings === undefined && typeof turn.rating === 'number'
      ? { average: turn.rating, votes: 1 }
      : null;
  }

  const total = entries.reduce((sum, [, value]) => sum + value, 0);
  return { average: total / entries.length, votes: entries.length };
}

/** What this account said, if it has said anything. */
export function myRating(turn: Turn, uid: string | undefined): number | undefined {
  if (!uid) return undefined;
  return turn.ratings?.[uid];
}

/** One decimal, and no trailing ".0", 4 rather than 4.0. */
export function formatAverage(average: number): string {
  return String(Math.round(average * 10) / 10);
}
