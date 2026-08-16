import { useState } from 'react';
import { Gate } from '../components/Gate';
import { SignInSheet } from '../components/SignInSheet';
import { useAccount } from '../hooks/useAccount';
import { en } from '../i18n/en';

type InviteProps = {
  /** The rotation the link points at, once its name has come down. */
  familyName?: string;
  /** Leaves the invitation, dropping the link from the address bar. */
  onLeave: () => void;
};

/**
 * Where a shared link lands a phone with nobody signed in. It says which
 * rotation the link is for and asks for a sign-in, and shows nothing else:
 * whose turn it is is for the people in it.
 */
export function Invite({ familyName, onLeave }: InviteProps) {
  const { account } = useAccount();
  const [signingIn, setSigningIn] = useState(false);
  const name = familyName?.trim() || en.invite.unnamed;

  return (
    <Gate kicker={en.invite.kicker} title={name} sub={en.invite.blurb}>
      <button className="close" type="button" onClick={() => setSigningIn(true)}>
        {en.invite.action}
      </button>

      <button className="gate-plain" type="button" onClick={onLeave}>
        {en.invite.notNow}
      </button>

      <SignInSheet open={signingIn} account={account} onClose={() => setSigningIn(false)} />
    </Gate>
  );
}
