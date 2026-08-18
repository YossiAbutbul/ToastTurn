import { mergeFamily } from '../lib/mergeFamily';
import { logTurn, removeTurn, skipWeek } from '../lib/rotation';
import type { Family, Person } from '../lib/types';

export type State = {
  /** The rotation on screen. Everything else acts on this one. */
  family: Family | null;
  /** The other rotations this phone is in, waiting to be switched to. */
  others: Family[];
  /** False until storage has been read once, stops the setup screen flashing. */
  ready: boolean;
};

export type Action =
  | { type: 'hydrate'; families: Family[] }
  | { type: 'applyRemote'; family: Family }
  | { type: 'createFamily'; family: Family }
  | { type: 'switchFamily'; id: string }
  | { type: 'renameFamily'; name: string }
  | { type: 'logTurn'; id: string; madeAt: string; personId?: string }
  | { type: 'skipWeek'; id: string; madeAt: string }
  | { type: 'rateTurn'; turnId: string; uid: string; rating: number }
  | { type: 'removeTurn'; turnId: string }
  | { type: 'addPerson'; person: Person }
  | { type: 'removePerson'; id: string }
  | { type: 'setActive'; id: string; active: boolean }
  | { type: 'setColor'; id: string; color: string }
  | { type: 'movePerson'; id: string; delta: number }
  | { type: 'reset' };

export const initialState: State = { family: null, others: [], ready: false };

/** Renumber from zero so `order` never drifts or collides. */
function renumber(people: Person[]): Person[] {
  return [...people]
    .sort((a, b) => a.order - b.order)
    .map((person, index) => ({ ...person, order: index }));
}

/** Every rotation this phone holds, the open one first. */
export function allFamilies(state: State): Family[] {
  return state.family ? [state.family, ...state.others] : state.others;
}

/**
 * Open one rotation and stand the rest behind it. The one being opened is
 * pulled out of the list wherever it was, so nothing is ever held twice.
 */
function open(state: State, family: Family): State {
  const rest = allFamilies(state).filter((other) => other.id !== family.id);
  return { family, others: rest, ready: true };
}

export function familyReducer(state: State, action: Action): State {
  if (action.type === 'hydrate') {
    const [first, ...rest] = action.families;
    return { family: first ?? null, others: rest, ready: true };
  }

  if (action.type === 'applyRemote') {
    // A rotation this phone is already in stays where it is; a new one, from a
    // link just opened, comes to the front without dropping the others.
    const held = allFamilies(state).find((other) => other.id === action.family.id) ?? null;
    if (held && held.id === state.family?.id) {
      return { ...state, family: mergeFamily(held, action.family), ready: true };
    }
    return open(state, mergeFamily(held, action.family));
  }

  if (action.type === 'createFamily') return open(state, action.family);

  if (action.type === 'switchFamily') {
    const wanted = state.others.find((other) => other.id === action.id);
    return wanted ? open(state, wanted) : state;
  }

  // Leaving a rotation drops it and opens the next one this phone holds.
  if (action.type === 'reset') {
    const [next, ...rest] = state.others;
    return { family: next ?? null, others: rest, ready: true };
  }

  const family = state.family;
  if (!family) return state;

  switch (action.type) {
    case 'renameFamily':
      return { ...state, family: { ...family, name: action.name } };

    case 'logTurn':
      return {
        ...state,
        // With no person named it credits whoever is up, which is what the
        // lever does. The owner filling in a day gone by names one.
        family: logTurn(family, { id: action.id, madeAt: action.madeAt, personId: action.personId }),
      };

    case 'skipWeek':
      return { ...state, family: skipWeek(family, { id: action.id, madeAt: action.madeAt }) };

    case 'rateTurn':
      return {
        ...state,
        family: {
          ...family,
          turns: family.turns.map((turn) =>
            turn.id === action.turnId
              ? { ...turn, ratings: { ...turn.ratings, [action.uid]: action.rating } }
              : turn,
          ),
        },
      };

    case 'removeTurn':
      return { ...state, family: removeTurn(family, action.turnId) };

    case 'addPerson':
      return {
        ...state,
        family: { ...family, people: renumber([...family.people, action.person]) },
      };

    case 'removePerson':
      return {
        ...state,
        family: { ...family, people: renumber(family.people.filter((p) => p.id !== action.id)) },
      };

    case 'setActive':
      return {
        ...state,
        family: {
          ...family,
          people: family.people.map((p) => (p.id === action.id ? { ...p, active: action.active } : p)),
        },
      };

    // Only the owner takes this path: everyone else keeps their colour in
    // their own membership entry, which is theirs to write.
    case 'setColor':
      return {
        ...state,
        family: {
          ...family,
          people: family.people.map((p) => (p.id === action.id ? { ...p, color: action.color } : p)),
        },
      };

    case 'movePerson': {
      const ordered = renumber(family.people);
      const from = ordered.findIndex((p) => p.id === action.id);
      const to = from + action.delta;
      if (from === -1 || to < 0 || to >= ordered.length) return state;

      const moved = [...ordered];
      const [person] = moved.splice(from, 1);
      moved.splice(to, 0, person);
      return { ...state, family: { ...family, people: renumber(moved.map((p, i) => ({ ...p, order: i }))) } };
    }

    default:
      return state;
  }
}
