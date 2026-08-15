import { en } from '../i18n/en';
import { initialOf } from '../lib/format';
import { PALETTE } from '../lib/palette';
import type { Account } from '../lib/auth';
import type { Person } from '../lib/types';
import './SettingsYou.css';

type SettingsYouProps = {
  /** Who this phone says it is, if anyone has said yet. */
  me: Person | null;
  color: string;
  account: Account | null;
  onPickColor: (color: string) => void;
  onSignIn: () => void;
  onSignOut: () => void;
};

/** The "you" half of settings: your toast, your colour, your account. */
export function SettingsYou({
  me,
  color,
  account,
  onPickColor,
  onSignIn,
  onSignOut,
}: SettingsYouProps) {
  return (
    <>
      <div className="profile-card">
        <span className="profile-toast" style={{ background: color }}>
          {me ? initialOf(me.name) : '?'}
        </span>
        <div className="profile-who">
          <b>{me ? me.name : en.profile.nobody}</b>
          <p className="empty">
            {me ? (account?.email ?? en.profile.thisPhone) : en.profile.notInRotation}
          </p>
        </div>
      </div>

      {me && (
        <div className="swatches" role="group" aria-label={en.profile.colour}>
          {PALETTE.map((swatch) => (
            <button
              key={swatch}
              type="button"
              className={swatch === color ? 'swatch on' : 'swatch'}
              style={{ background: swatch }}
              aria-label={swatch}
              aria-pressed={swatch === color}
              onClick={() => onPickColor(swatch)}
            />
          ))}
        </div>
      )}

      {account ? (
        <>
          <p className="empty">{en.signIn.signedInAs(account.email ?? '')}</p>
          <button className="ghost" type="button" onClick={onSignOut}>
            {en.signIn.signOut}
          </button>
        </>
      ) : (
        <button className="ghost" type="button" onClick={onSignIn}>
          {en.signIn.open}
        </button>
      )}
    </>
  );
}
