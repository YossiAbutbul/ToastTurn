import { useState } from 'react';
import { Sheet } from './Sheet';
import { SettingsYou } from './SettingsYou';
import { ScheduleFields } from './ScheduleFields';
import { en } from '../i18n/en';
import { initialOf } from '../lib/format';
import { linkForFamily } from '../lib/url';
import type { Account } from '../lib/auth';
import type { Family, Person, Schedule } from '../lib/types';

type SettingsSheetProps = {
  open: boolean;
  family: Family;
  account: Account | null;
  onClose: () => void;
  me: Person | null;
  onClaim: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
  onSchedule: (patch: Partial<Schedule>) => void;
  onToggleHoliday: (personId: string, active: boolean) => void;
  onEditPeople: () => void;
  onStartOver: () => void;
  /** False on a phone that joined by link: it can log toast, not run the rotation. */
  isOwner: boolean;
};

/** Everything adjustable, in one place: you first, then the rotation. */
export function SettingsSheet(props: SettingsSheetProps) {
  const { family, isOwner, onClose, open } = props;
  const [copied, setCopied] = useState(false);
  const people = [...family.people].sort((a, b) => a.order - b.order);

  const copyLink = async () => {
    await navigator.clipboard.writeText(linkForFamily(window.location.origin, family.id));
    setCopied(true);
  };

  return (
    <Sheet open={open} title={en.settings.title} onClose={onClose}>
      <div className="fieldlabel">{en.settings.youSection}</div>
      <SettingsYou
        account={props.account}
        isOwner={isOwner}
        me={props.me}
        onClaim={props.onClaim}
        onSignIn={props.onSignIn}
        onSignOut={props.onSignOut}
      />

      <div className="fieldlabel spaced">{en.settings.rotationSection}</div>
      <button className="ghost" type="button" onClick={() => void copyLink()}>
        {copied ? en.settings.shared : en.settings.share}
      </button>

      {!isOwner && <p className="empty">{en.settings.guest}</p>}

      {isOwner && (
        <>
          <div className="fieldlabel spaced">{en.schedule.title}</div>
          <ScheduleFields schedule={family.schedule} onChange={props.onSchedule} />

          <div className="fieldlabel spaced">{en.settings.holiday}</div>
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
                onClick={() => props.onToggleHoliday(person.id, !person.active)}
              >
                <i />
              </button>
            </div>
          ))}

          <button className="ghost" type="button" onClick={props.onEditPeople}>
            {en.settings.editPeople}
          </button>
          <button className="ghost" type="button" onClick={props.onStartOver}>
            {en.settings.startOver}
          </button>
        </>
      )}
    </Sheet>
  );
}
