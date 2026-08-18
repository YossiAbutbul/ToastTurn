import { useState } from 'react';
import { Sheet } from './Sheet';
import { SettingsYou } from './SettingsYou';
import { RotationList } from './RotationList';
import { RosterList } from './RosterList';
import { AddPerson } from './AddPerson';
import { Confirm } from './Confirm';
import { ShareCode } from './ShareCode';
import { en } from '../i18n/en';
import { colorForIndex } from '../lib/palette';
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
  /** Owner only: one more name in the rotation. */
  onAddPerson: (name: string, color: string) => void;
  /** Owner only: take someone out of the rotation, claim and all. */
  onRemovePerson: (personId: string) => void;
  onStartOver: () => void;
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
          <div className="fieldlabel spaced">{en.settings.peopleSection}</div>
          <RosterList
            people={people}
            ownerPersonId={family.ownerPersonId}
            onToggleHoliday={props.onToggleHoliday}
            onRemove={props.onRemovePerson}
          />

          <div className="fieldlabel spaced">{en.settings.addPerson}</div>
          <AddPerson suggested={colorForIndex(people.length)} onAdd={props.onAddPerson} />


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
