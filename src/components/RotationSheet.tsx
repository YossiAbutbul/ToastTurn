import { useState } from 'react';
import { Sheet } from './Sheet';
import { RosterList } from './RosterList';
import { ArrangeSheet } from './ArrangeSheet';
import { AddPerson } from './AddPerson';
import { PenIcon } from './PenIcon';
import { en } from '../i18n/en';
import { colorForIndex } from '../lib/palette';
import { arrangeOrder, getCurrentPerson } from '../lib/rotation';
import type { Family } from '../lib/types';

type RotationSheetProps = {
  open: boolean;
  family: Family;
  onClose: () => void;
  onAddPerson: (name: string, color: string) => void;
  onRemovePerson: (personId: string) => void;
  onReorderPeople: (ids: string[]) => void;
  onToggleHoliday: (personId: string, active: boolean) => void;
};

/**
 * Everyone in the rotation, and everything you do to them.
 *
 * It used to be spread between the settings sheet and a screen of its own,
 * which meant adding a name and moving one were two different journeys. This
 * is the one place: who is in it, what order they come round in, who is away,
 * and who is leaving. The owner's, and nobody else sees it.
 *
 * The question it answers most often is "who is in it", so that is what it
 * opens on: the list first, the box for another name under it, and the pen at
 * the top for the order and the bins. Both lists read the rotation the way
 * the queue along the bottom of the screen does — from whoever is up — so the
 * order arranged here is the order seen there.
 */
export function RotationSheet({
  open,
  family,
  onClose,
  onAddPerson,
  onRemovePerson,
  onReorderPeople,
  onToggleHoliday,
}: RotationSheetProps) {
  const people = arrangeOrder(family);
  const current = getCurrentPerson(family);
  const [arranging, setArranging] = useState(false);

  // The pen is a state of this sheet, not of the rotation: closing it and
  // opening it again asks the usual question, not the last one. Put down as
  // the sheet goes rather than in an effect afterwards, so it is already
  // down by the time the sheet is next painted.
  if (!open && arranging) setArranging(false);

  return (
    <>
      {/* One height whatever the rotation grows to: without it the sheet
          climbed the screen with every name added, and the list moved under
          the finger. */}
      <Sheet
        open={open}
        title={en.settings.rotationTitle}
        onClose={onClose}
        fixedHeight
        covered={arranging}
        headerAction={
          people.length > 0 ? (
            <button
              type="button"
              className="row-x sheet-edit"
              aria-label={en.settings.editRotation}
              onClick={() => setArranging(true)}
            >
              <PenIcon />
            </button>
          ) : undefined
        }
      >
        {people.length === 0 ? (
          <p className="empty">{en.setup.empty}</p>
        ) : (
          <RosterList people={people} currentId={current?.id} onToggleHoliday={onToggleHoliday} />
        )}

        <div className="fieldlabel spaced">{en.settings.addPerson}</div>
        <AddPerson suggested={colorForIndex(people.length)} onAdd={onAddPerson} />
      </Sheet>

      {/* A sheet of its own, over this one rather than inside it: a sheet is
          fixed to the screen, and one nested in another is fixed to that. */}
      <ArrangeSheet
        open={arranging}
        people={people}
        currentId={current?.id}
        ownerPersonId={family.ownerPersonId}
        onClose={() => setArranging(false)}
        onReorder={onReorderPeople}
        onRemove={onRemovePerson}
      />
    </>
  );
}
