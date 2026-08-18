import { Sheet } from './Sheet';
import { RosterList } from './RosterList';
import { AddPerson } from './AddPerson';
import { en } from '../i18n/en';
import { colorForIndex } from '../lib/palette';
import type { Family } from '../lib/types';

type RotationSheetProps = {
  open: boolean;
  family: Family;
  onClose: () => void;
  onAddPerson: (name: string, color: string) => void;
  onRemovePerson: (personId: string) => void;
  onMovePerson: (personId: string, delta: number) => void;
  onToggleHoliday: (personId: string, active: boolean) => void;
};

/**
 * Everyone in the rotation, and everything you do to them.
 *
 * It used to be spread between the settings sheet and a screen of its own,
 * which meant adding a name and moving one were two different journeys. This
 * is the one place: who is in it, what order they come round in, who is away,
 * and who is leaving. The owner's, and nobody else sees it.
 */
export function RotationSheet({
  open,
  family,
  onClose,
  onAddPerson,
  onRemovePerson,
  onMovePerson,
  onToggleHoliday,
}: RotationSheetProps) {
  const people = [...family.people].sort((a, b) => a.order - b.order);

  return (
    // One height whatever the rotation grows to: without it the sheet climbed
    // the screen with every name added, and the list moved under the finger.
    <Sheet open={open} title={en.settings.rotationTitle} onClose={onClose} fixedHeight>
      {/* Above the list rather than below it: at the bottom of a rotation of
          eight it is a scroll away, and it moves every time somebody joins. */}
      <div className="fieldlabel">{en.settings.addPerson}</div>
      <AddPerson suggested={colorForIndex(people.length)} onAdd={onAddPerson} />

      <div className="fieldlabel spaced">{en.settings.rotationTitle}</div>
      {people.length === 0 ? (
        <p className="empty">{en.setup.empty}</p>
      ) : (
        <RosterList
          people={people}
          ownerPersonId={family.ownerPersonId}
          onMove={onMovePerson}
          onToggleHoliday={onToggleHoliday}
          onRemove={onRemovePerson}
        />
      )}
    </Sheet>
  );
}
