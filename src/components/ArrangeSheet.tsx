import { useState } from 'react';
import { Sheet } from './Sheet';
import { BinIcon } from './BinIcon';
import { GripIcon } from './GripIcon';
import { Confirm } from './Confirm';
import { useDragList } from '../hooks/useDragList';
import { en } from '../i18n/en';
import { initialOf } from '../lib/format';
import type { Person } from '../lib/types';
import './ArrangeSheet.css';

type ArrangeSheetProps = {
  open: boolean;
  /** Everyone, in the order the queue along the bottom reads them. */
  people: Person[];
  /** Whoever is up. They anchor the ring, so their row stays put. */
  currentId?: string;
  /** Which of them runs it. They stay: a rotation with no owner is nobody's. */
  ownerPersonId?: string;
  onClose: () => void;
  onReorder: (ids: string[]) => void;
  onRemove: (personId: string) => void;
};

/**
 * Rearranging the rotation, and nothing else.
 *
 * It is a sheet of its own rather than a mode of the one behind it because
 * the two lists answer different questions. That one says who is in it and
 * who is away; this one says who comes after who, so it drops the switches,
 * carries a handle per row, and reads in exactly the order the queue along
 * the bottom of the screen does — the same people, the same sequence.
 *
 * Every row moves, the one who is up along with them. Where somebody lands
 * can change who is up - the row before the top of the ring is whoever last
 * made toast, so putting someone else there hands the turn on - and when it
 * does, the list re-reads from the new answer rather than pretending it
 * didn't. Carrying the person who is up all the way to the bottom is the one
 * move that changes nothing: past the last row is where they already were.
 */
export function ArrangeSheet({
  open,
  people,
  currentId,
  ownerPersonId,
  onClose,
  onReorder,
  onRemove,
}: ArrangeSheetProps) {
  const [asking, setAsking] = useState<Person | null>(null);

  const drag = useDragList(
    people.map((person) => person.id),
    onReorder,
  );

  // The list as it stands, which while a row is in the air is not the list
  // the rotation holds yet.
  const byId = new Map(people.map((person) => [person.id, person]));
  const shown = drag.order
    .map((id) => byId.get(id))
    .filter((person): person is Person => person !== undefined);

  // Where each row comes in the queue. Only the people in it are counted:
  // somebody on holiday is skipped when their turn comes round, so giving
  // them a number would push everyone else's out by one, and the numbers are
  // there to say when, not how many rows down.
  const places = new Map<string, number>();
  let place = 0;
  for (const person of shown) {
    if (person.active) place += 1;
    places.set(person.id, person.active ? place : 0);
  }

  const row = (person: Person) => (
    <div
      className={drag.dragging === person.id ? 'arrange-row lifted' : 'arrange-row'}
      key={person.id}
      data-drag-row={person.id}
      style={
        drag.dragging === person.id ? { transform: `translateY(${drag.offset}px)` } : undefined
      }
    >
      <button
        type="button"
        className="grip"
        aria-label={en.settings.dragPerson(person.name)}
        {...drag.grip(person.id)}
      >
        <GripIcon />
      </button>

      <span className="place">{places.get(person.id) || '–'}</span>

      <span className="mini" style={{ background: person.color }}>
        {initialOf(person.name)}
      </span>
      <b>{person.name}</b>

      <span className="when">
        {person.id === currentId ? en.settings.upFirst : !person.active ? en.settings.holiday : ''}
      </span>

      {/* Taking yourself out would leave the rotation with nobody to run it,
          so the owner's own row has no bin. */}
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
    </div>
  );

  return (
    <Sheet open={open} title={en.settings.editRotation} onClose={onClose} fixedHeight onTop>
      <p className="arrange-blurb">{en.settings.rotationBlurb}</p>

      <div className="arrange" data-drag-list>
        {shown.map((person) => row(person))}
      </div>

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
    </Sheet>
  );
}
