import { en } from '../i18n/en';
import { initialOf } from '../lib/format';
import type { Person } from '../lib/types';

type RosterListProps = {
  /** Everyone in the rotation, in the order the queue reads them. */
  people: Person[];
  /** Whoever is up, so the list says where it starts. */
  currentId?: string;
  onToggleHoliday: (personId: string, active: boolean) => void;
};

/**
 * The people, each with a holiday switch.
 *
 * Reading, not rearranging: who is in it and who is away. Moving them around
 * and taking them out is the pen at the top of the sheet, which opens a list
 * of its own — a row carrying all of it at once was six controls wide and
 * read as a form rather than as a list of people.
 */
export function RosterList({ people, currentId, onToggleHoliday }: RosterListProps) {
  return (
    <>
      {people.map((person) => (
        <div className="row" key={person.id}>
          <span className="mini" style={{ background: person.color }}>
            {initialOf(person.name)}
          </span>
          <b>{person.name}</b>

          {person.id === currentId && <span className="when">{en.settings.upFirst}</span>}

          <button
            type="button"
            className={person.active ? 'tog' : 'tog on'}
            role="switch"
            aria-checked={!person.active}
            aria-label={`${en.settings.holiday}, ${person.name}`}
            onClick={() => onToggleHoliday(person.id, !person.active)}
          >
            <i />
          </button>
        </div>
      ))}
    </>
  );
}
