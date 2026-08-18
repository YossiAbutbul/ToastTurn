import { useState } from 'react';
import { BinIcon } from './BinIcon';
import { Confirm } from './Confirm';
import { en } from '../i18n/en';
import { initialOf } from '../lib/format';
import type { Person } from '../lib/types';

type RosterListProps = {
  /** Everyone in the rotation, in rotation order. */
  people: Person[];
  /** Which of them runs it. They stay: a rotation with no owner is nobody's. */
  ownerPersonId?: string;
  onToggleHoliday: (personId: string, active: boolean) => void;
  onRemove: (personId: string) => void;
};

/** The people, each with a holiday switch and a way out of the rotation. */
export function RosterList({ people, ownerPersonId, onToggleHoliday, onRemove }: RosterListProps) {
  const [asking, setAsking] = useState<Person | null>(null);

  return (
    <>
      {people.map((person) => (
        <div className="row" key={person.id}>
          <span className="mini" style={{ background: person.color }}>
            {initialOf(person.name)}
          </span>
          <b>{person.name}</b>

          {/* Beside the name, because it is about the person, not about the
              switch. Taking yourself out would leave the rotation with nobody
              to run it, so the owner's own row has no bin. */}
          {person.id !== ownerPersonId && (
            <button
              type="button"
              className="row-x"
              aria-label={en.settings.removePerson(person.name)}
              onClick={() => setAsking(person)}
            >
              <BinIcon />
            </button>
          )}

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

      <Confirm
        open={asking !== null}
        title={en.settings.removeAsk(asking?.name ?? '')}
        note={en.settings.removeNote}
        confirmLabel={en.settings.removeYes}
        cancelLabel={en.settings.removeNo}
        onCancel={() => setAsking(null)}
        onConfirm={() => {
          if (asking) onRemove(asking.id);
          setAsking(null);
        }}
      />
    </>
  );
}
