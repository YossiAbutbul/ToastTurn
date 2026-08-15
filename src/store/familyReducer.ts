import { mergeFamily } from '../lib/mergeFamily';
import { logTurn, skipWeek, swapPeople } from '../lib/rotation';
import type { Family, Person, Schedule } from '../lib/types';

export type State = {
  family: Family | null;
  /** False until storage has been read once — stops the setup screen flashing. */
  ready: boolean;
};

export type Action =
  | { type: 'hydrate'; family: Family | null }
  | { type: 'applyRemote'; family: Family }
  | { type: 'createFamily'; family: Family }
  | { type: 'renameFamily'; name: string }
  | { type: 'logTurn'; id: string; madeAt: string }
  | { type: 'skipWeek'; id: string; madeAt: string }
  | { type: 'rateTurn'; turnId: string; uid: string; rating: number }
  | { type: 'swap'; aId: string; bId: string }
  | { type: 'setSchedule'; schedule: Partial<Schedule> }
  | { type: 'addPerson'; person: Person }
  | { type: 'removePerson'; id: string }
  | { type: 'setActive'; id: string; active: boolean }
  | { type: 'movePerson'; id: string; delta: number }
  | { type: 'reset' };

export const initialState: State = { family: null, ready: false };

/** Renumber from zero so `order` never drifts or collides. */
function renumber(people: Person[]): Person[] {
  return [...people]
    .sort((a, b) => a.order - b.order)
    .map((person, index) => ({ ...person, order: index }));
}

export function familyReducer(state: State, action: Action): State {
  if (action.type === 'hydrate') return { family: action.family, ready: true };
  if (action.type === 'applyRemote') {
    return { family: mergeFamily(state.family, action.family), ready: true };
  }
  if (action.type === 'createFamily') return { family: action.family, ready: true };
  if (action.type === 'reset') return { family: null, ready: true };

  const family = state.family;
  if (!family) return state;

  switch (action.type) {
    case 'renameFamily':
      return { ...state, family: { ...family, name: action.name } };

    case 'logTurn':
      return { ...state, family: logTurn(family, { id: action.id, madeAt: action.madeAt }) };

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

    case 'swap':
      return { ...state, family: swapPeople(family, action.aId, action.bId) };

    case 'setSchedule':
      return { ...state, family: { ...family, schedule: { ...family.schedule, ...action.schedule } } };

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
