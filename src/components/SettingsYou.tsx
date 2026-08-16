import { ColorPicker } from './ColorPicker';
import { en } from '../i18n/en';
import { initialOf } from '../lib/format';
import type { Account } from '../lib/auth';
import type { Person } from '../lib/types';
import './SettingsYou.css';

type SettingsYouProps = {
  account: Account | null;
  /** Which person in the rotation this account said it is. */
  me: Person | null;
  isOwner: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
  /** Everyone picks their own colour, owner or not. */
  onSetColor: (color: string) => void;
};

function Colour({ me, onSetColor }: { me: Person; onSetColor: (color: string) => void }) {
  return (
    <>
      <div className="fieldlabel">{en.color.title}</div>
      <ColorPicker value={me.color} initial={initialOf(me.name)} onChange={onSetColor} />
    </>
  );
}

/** Who you are here, the colour you go by, and the account behind it. */
export function SettingsYou({ account, me, isOwner, onSignIn, onSignOut, onSetColor }: SettingsYouProps) {
  // No keys means no accounts, but there is still a you, and still a colour.
  if (!account) {
    return (
      <>
        {me && <Colour me={me} onSetColor={onSetColor} />}
        <p className="empty">{en.profile.signedOut}</p>
        <button className="ghost" type="button" onClick={onSignIn}>
          {en.signIn.open}
        </button>
      </>
    );
  }

  return (
    <>
      {me && (
        <div className="profile-card">
          <span className="profile-toast" style={{ background: me.color }}>
            {initialOf(me.name)}
          </span>
          <div className="profile-who">
            <b>{me.name}</b>
            <p className="empty">{account.email}</p>
          </div>
        </div>
      )}

      {me && <Colour me={me} onSetColor={onSetColor} />}

      {!me && <p className="empty">{en.signIn.signedInAs(account.email ?? '')}</p>}
      {!isOwner && <p className="empty">{en.profile.notOwner}</p>}

      <button className="ghost" type="button" onClick={onSignOut}>
        {en.signIn.signOut}
      </button>
    </>
  );
}
