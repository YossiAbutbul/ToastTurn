import { useState } from 'react';
import { Sheet } from './Sheet';
import { SettingsYou } from './SettingsYou';
import { RotationList } from './RotationList';
import { Confirm } from './Confirm';
import { ShareCode } from './ShareCode';
import { HandOver } from './HandOver';
import { en } from '../i18n/en';
import { initialOf } from '../lib/format';
import type { Account } from '../lib/auth';
import type { MembershipState } from '../hooks/useMembership';
import type { Family, Person } from '../lib/types';

type SettingsSheetProps = {
  open: boolean;
  family: Family;
  account: Account | null;
  onClose: () => void;
  me: Person | null;
  membership: MembershipState;
  onSignIn: () => void;
  onSignOut: () => void;
  onSetColor: (color: string) => void;
  onToggleHoliday: (personId: string, active: boolean) => void;
  onEditPeople: () => void;
  onStartOver: () => void;
  /** Owner only: let someone in, adding them to the rotation by name. */
  onApprove: (uid: string, name: string) => void;
  /** Owner only: pass the rotation to somebody else's account, for good. */
  onHandOver: (uid: string, personId: string) => void;
  /** Every rotation this phone is in, the open one first. */
  families: Family[];
  onSwitchFamily: (id: string) => void;
  onNewFamily: () => void;
  /** False on a phone that joined by link: it can log toast, not run the rotation. */
  isOwner: boolean;
};

/** Everything adjustable, in one place: you first, then the rotation. */
export function SettingsSheet(props: SettingsSheetProps) {
  const { family, isOwner, onClose, open } = props;
  // Clearing the rotation cannot be undone, so it is asked over the sheet.
  const [clearing, setClearing] = useState(false);
  const people = [...family.people].sort((a, b) => a.order - b.order);

  return (
    <Sheet open={open} title={en.settings.title} onClose={onClose}>
      <div className="fieldlabel">{en.settings.youSection}</div>
      <SettingsYou
        account={props.account}
        isOwner={isOwner}
        me={props.me}
        onSignIn={props.onSignIn}
        onSignOut={props.onSignOut}
        onSetColor={props.onSetColor}
      />

      <div className="fieldlabel spaced">{en.settings.rotationsSection}</div>
      <RotationList
        families={props.families}
        openId={family.id}
        onSwitch={props.onSwitchFamily}
        onNew={props.onNewFamily}
      />

      <div className="fieldlabel spaced">{en.settings.rotationSection}</div>
      <ShareCode familyId={family.id} />

      {!isOwner && <p className="empty">{en.settings.guest}</p>}

      {isOwner && (
        <>
          <div className="fieldlabel spaced">{en.member.waiting}</div>
          {props.membership.waiting.length === 0 && <p className="empty">{en.member.nobodyWaiting}</p>}
          {props.membership.waiting.map((person) => (
            <div className="row" key={person.uid}>
              <div className="waiting-who">
                <b>{person.name || en.member.waitingUnnamed}</b>
                <span className="waiting-email">{person.email}</span>
              </div>
              <button
                type="button"
                className="ghost let-in"
                onClick={() => props.onApprove(person.uid, person.name)}
              >
                {en.member.approve}
              </button>
            </div>
          ))}

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
                aria-label={`${en.settings.holiday}, ${person.name}`}
                onClick={() => props.onToggleHoliday(person.id, !person.active)}
              >
                <i />
              </button>
            </div>
          ))}

          <button className="ghost" type="button" onClick={props.onEditPeople}>
            {en.settings.editPeople}
          </button>

          <HandOver
            family={family}
            approved={props.membership.approved}
            onHandOver={props.onHandOver}
          />

          <button className="ghost" type="button" onClick={() => setClearing(true)}>
            {en.settings.startOver}
          </button>

          <Confirm
            open={clearing}
            title={en.settings.startOverAsk(family.name || en.invite.unnamed)}
            note={en.settings.startOverNote}
            confirmLabel={en.settings.startOverYes}
            cancelLabel={en.settings.startOverNo}
            onCancel={() => setClearing(false)}
            onConfirm={() => {
              setClearing(false);
              props.onStartOver();
            }}
          />
        </>
      )}
    </Sheet>
  );
}
