import { TURN_CAP } from './types';
import type { Family, Turn } from './types';

/**
 * Fold what the other phones say into what this one holds.
 *
 * Turns are append-only, so the union of both logs is always right, a turn
 * logged offline here survives, and one logged on another phone arrives.
 * Name, people and schedule are single values, so the remote copy wins: every
 * local edit is pushed the moment it happens, which makes the server the one
 * place that settles two phones editing at once.
 */
export function mergeFamily(local: Family | null, remote: Family): Family {
  if (!local || local.id !== remote.id) return { ...remote, turns: sortTurns(remote.turns) };

  const byId = new Map<string, Turn>();
  for (const turn of local.turns) byId.set(turn.id, turn);
  for (const turn of remote.turns) {
    // Ratings are per account, so the two sides are unioned rather than one
    // winning: a rating given here survives a snapshot that predates it, and
    // one given elsewhere arrives.
    const mine = byId.get(turn.id);
    const ratings = { ...mine?.ratings, ...turn.ratings };
    byId.set(turn.id, {
      ...turn,
      rating: turn.rating ?? mine?.rating,
      ...(Object.keys(ratings).length > 0 ? { ratings } : {}),
    });
  }

  return {
    ...local,
    ownerUid: remote.ownerUid ?? local.ownerUid,
    ownerPersonId: remote.ownerPersonId ?? local.ownerPersonId,
    name: remote.name,
    people: remote.people,
    schedule: remote.schedule,
    turns: sortTurns([...byId.values()]),
  };
}

function sortTurns(turns: Turn[]): Turn[] {
  return [...turns]
    .sort((a, b) => (a.madeAt === b.madeAt ? a.id.localeCompare(b.id) : b.madeAt.localeCompare(a.madeAt)))
    .slice(0, TURN_CAP);
}

/** Turns the others have not seen, or have seen at a different time. */
export function unsentTurns(local: Family, remote: Family | null): Turn[] {
  const published = new Map((remote?.turns ?? []).map((turn) => [turn.id, turn]));
  return local.turns.filter((turn) => {
    const theirs = published.get(turn.id);
    return !theirs || theirs.madeAt !== turn.madeAt;
  });
}

/**
 * Ratings this account has given that are not up yet. They go separately from
 * the turn itself: a turn is written once, a rating lands whenever someone has
 * an opinion, and only ever under their own key.
 */
export function unsentRatings(
  local: Family,
  remote: Family | null,
  uid: string | undefined,
): { turnId: string; rating: number }[] {
  if (!uid) return [];
  const published = new Map((remote?.turns ?? []).map((turn) => [turn.id, turn]));

  return local.turns
    .filter((turn) => {
      const theirs = published.get(turn.id);
      // Only rate turns the others already have, or the rating would arrive as
      // a document with a rating and nothing else in it.
      if (!theirs) return false;
      const mine = turn.ratings?.[uid];
      return mine !== undefined && theirs.ratings?.[uid] !== mine;
    })
    .map((turn) => ({ turnId: turn.id, rating: turn.ratings![uid] }));
}

/** True when name, people or schedule differ from what is published. */
export function metaChanged(local: Family, remote: Family | null): boolean {
  if (!remote) return true;
  return (
    local.name !== remote.name ||
    local.ownerPersonId !== remote.ownerPersonId ||
    JSON.stringify(local.schedule) !== JSON.stringify(remote.schedule) ||
    JSON.stringify(local.people) !== JSON.stringify(remote.people)
  );
}
