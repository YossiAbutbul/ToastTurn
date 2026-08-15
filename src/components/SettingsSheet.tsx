import { Sheet } from './Sheet';
import { en } from '../i18n/en';
import { initialOf } from '../lib/format';
import type { Family } from '../lib/types';

type SettingsSheetProps = {
  open: boolean;
  family: Family;
  onClose: () => void;
  onEditPeople: () => void;
  onToggleHoliday: (personId: string, active: boolean) => void;
  onStartOver: () => void;
};

export function SettingsSheet({
  open,
  family,
  onClose,
  onEditPeople,
  onToggleHoliday,
  onStartOver,
}: SettingsSheetProps) {
  const people = [...family.people].sort((a, b) => a.order - b.order);

  return (
    <Sheet open={open} title={en.settings.title} onClose={onClose}>
      <div className="fieldlabel">{en.settings.holiday}</div>
      {people.map((person) => (
        <div className="row" key={person.id}>
          <span className="mini" style={{ background: person.color }}>
            {initialOf(person.name)}
          </span>
          <b>{person.name}</b>
          <button
            type="button"
            className={person.active ? 'tog' : 'tog on'}
            role="switch"
            aria-checked={!person.active}
            aria-label={`${en.settings.holiday} — ${person.name}`}
            onClick={() => onToggleHoliday(person.id, !person.active)}
          >
            <i />
          </button>
        </div>
      ))}

      <button className="ghost" type="button" onClick={onEditPeople}>
        {en.settings.editPeople}
      </button>
      <button className="ghost" type="button" onClick={onStartOver}>
        {en.settings.startOver}
      </button>
    </Sheet>
  );
}
