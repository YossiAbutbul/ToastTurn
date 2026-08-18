import { useState } from 'react';
import { Sheet } from './Sheet';
import { RotationList } from './RotationList';
import { Confirm } from './Confirm';
import { ShareCode } from './ShareCode';
import { en } from '../i18n/en';
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
  /** Owner only: what this rotation is called. */
  onRename: (name: string) => void;
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

  return (
    <Sheet open={open} title={en.settings.title} onClose={onClose}>
      <div className="fieldlabel">{en.settings.rotationsSection}</div>
      <RotationList
        families={props.families}
        openId={family.id}
        onSwitch={props.onSwitchFamily}
        onNew={props.onNewFamily}
        onRename={isOwner ? props.onRename : undefined}
      />

      <div className="fieldlabel spaced">{en.settings.rotationSection}</div>
      <ShareCode familyId={family.id} />

      {!isOwner && <p className="empty">{en.settings.guest}</p>}

      {isOwner && (
        <>


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
