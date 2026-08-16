import { REMOVED_CAP, TURN_CAP } from './types';
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
  // A turn either side has taken off the board stays off it. The union below
  // would otherwise hand back whatever the other phone still holds, and the
  // phone that still held it would publish it again.
  const sameFamily = Boolean(local) && local!.id === remote.id;
  const removed = [
    ...new Set([...(sameFamily ? (local!.removed ?? []) : []), ...(remote.removed ?? [])]),
  ].slice(0, REMOVED_CAP);
  const gone = new Set(removed);
  const kept = (turns: Turn[]) => turns.filter((turn) => !gone.has(turn.id));
  const tombstones = removed.length > 0 ? { removed } : {};

  if (!sameFamily) {
    return { ...remote, ...tombstones, turns: sortTurns(kept(remote.turns)) };
  }

  const byId = new Map<string, Turn>();
  for (const turn of kept(local!.turns)) byId.set(turn.id, turn);
  for (const turn of kept(remote.turns)) {
    // Ratings are per account, so the two sides are unioned rather than one
    // winning: a rating given here survives a snapshot that predates it, and
    // one given elsewhere arrives.
    const mine = byId.get(turn.id);
    const ratings = { ...mine?.ratings, ...turn.ratings };
    // The single old-style rating is only carried when there is one: a key set
    // to undefined is not the same as no key to the server, which refuses it.
    const rating = turn.rating ?? mine?.rating;
    byId.set(turn.id, {
      ...turn,
      ...(rating === undefined ? {} : { rating }),
      ...(Object.keys(ratings).length > 0 ? { ratings } : {}),
    });
  }

  return {
    ...local!,
    ...tombstones,
    ownerUid: remote.ownerUid ?? local!.ownerUid,
    ownerPersonId: remote.ownerPersonId ?? local!.ownerPersonId,
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

/**
 * The comparable shape of the family's metadata.
 *
 * A round trip through Firestore is not value-preserving: a field left unset
 * here is written as null and comes back as null, and object keys come back in
 * whatever order they were stored in. Comparing the raw values therefore
 * reported a difference that no edit could ever resolve, so the phone
 * republished the family on every snapshot, and every write produced the next
 * snapshot. Two phones in that loop each kept reasserting their own toast
 * night, which is what made the time flip between AM and PM on its own.
 */
function metaShape(family: Family): string {
  return JSON.stringify({
    name: family.name ?? '',
    ownerPersonId: family.ownerPersonId ?? null,
    // Publishing these is how a removal reaches the other phones at all.
    removed: [...(family.removed ?? [])].sort(),
    schedule: {
      weekday: family.schedule.weekday,
      time: family.schedule.time,
      remind: family.schedule.remind,
    },
    people: family.people.map((person) => ({
      id: person.id,
      name: person.name,
      color: person.color,
      order: person.order,
      active: person.active,
    })),
  });
}

/** True when name, people or schedule differ from what is published. */
export function metaChanged(local: Family, remote: Family | null): boolean {
  if (!remote) return true;
  return metaShape(local) !== metaShape(remote);
}
