import { TURN_CAP } from './types';
import type { Family, Turn } from './types';

/**
 * Fold what the other phones say into what this one holds.
 *
 * Turns are append-only, so the union of both logs is always right — a turn
 * logged offline here survives, and one logged on another phone arrives.
 * Name, people and schedule are single values, so the remote copy wins: every
 * local edit is pushed the moment it happens, which makes the server the one
 * place that settles two phones editing at once.
 */
export function mergeFamily(local: Family | null, remote: Family): Family {
  if (!local || local.id !== remote.id) return { ...remote, turns: sortTurns(remote.turns) };

  const byId = new Map<string, Turn>();
  for (const turn of local.turns) byId.set(turn.id, turn);
  for (const turn of remote.turns) byId.set(turn.id, turn);

  return {
    ...local,
    ownerUid: remote.ownerUid ?? local.ownerUid,
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

/** Turns this phone has that the others have not seen yet. */
export function unsentTurns(local: Family, remoteTurnIds: Set<string>): Turn[] {
  return local.turns.filter((turn) => !remoteTurnIds.has(turn.id));
}

/** True when name, people or schedule differ from what is published. */
export function metaChanged(local: Family, remote: Family | null): boolean {
  if (!remote) return true;
  return (
    local.name !== remote.name ||
    JSON.stringify(local.schedule) !== JSON.stringify(remote.schedule) ||
    JSON.stringify(local.people) !== JSON.stringify(remote.people)
  );
}
