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
};

/** Who you are here, and the account behind it. */
export function SettingsYou({ account, me, isOwner, onSignIn, onSignOut }: SettingsYouProps) {
  if (!account) {
    return (
      <>
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

      {!me && <p className="empty">{en.signIn.signedInAs(account.email ?? '')}</p>}
      {!isOwner && <p className="empty">{en.profile.notOwner}</p>}

      <button className="ghost" type="button" onClick={onSignOut}>
        {en.signIn.signOut}
      </button>
    </>
  );
}
