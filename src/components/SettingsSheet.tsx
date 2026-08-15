import { useState } from 'react';
import { Sheet } from './Sheet';
import { en } from '../i18n/en';
import { initialOf } from '../lib/format';
import { linkForFamily } from '../lib/url';
import type { Family } from '../lib/types';

type SettingsSheetProps = {
  open: boolean;
  family: Family;
  onClose: () => void;
  onEditPeople: () => void;
  onToggleHoliday: (personId: string, active: boolean) => void;
  onStartOver: () => void;
  onWhoAmI: () => void;
};

export function SettingsSheet({
  open,
  family,
  onClose,
  onEditPeople,
  onToggleHoliday,
  onStartOver,
  onWhoAmI,
}: SettingsSheetProps) {
  const [copied, setCopied] = useState(false);
  const people = [...family.people].sort((a, b) => a.order - b.order);

  const copyLink = async () => {
    await navigator.clipboard.writeText(linkForFamily(window.location.origin, family.id));
    setCopied(true);
  };

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

      <button className="ghost" type="button" onClick={() => void copyLink()}>
        {copied ? en.settings.shared : en.settings.share}
      </button>
      <button className="ghost" type="button" onClick={onWhoAmI}>
        {en.settings.whoAmI}
      </button>
      <button className="ghost" type="button" onClick={onEditPeople}>
        {en.settings.editPeople}
      </button>
      <button className="ghost" type="button" onClick={onStartOver}>
        {en.settings.startOver}
      </button>
    </Sheet>
  );
}
