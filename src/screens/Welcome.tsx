import { useState } from 'react';
import { SignInSheet } from '../components/SignInSheet';
import { JoinSheet } from '../components/JoinSheet';
import { CheeseToast } from '../components/CheeseToast';
import { useAccount } from '../hooks/useAccount';
import { syncConfigured } from '../lib/firebase';
import { en } from '../i18n/en';
import './Welcome.css';

/**
 * The first screen on a phone with no family. Whoever runs the family signs in
 * here; everyone else never sees it, because a share link goes straight home.
 */
export function Welcome({ onStart, notFound }: { onStart: () => void; notFound?: boolean }) {
  const { account } = useAccount();
  const [signingIn, setSigningIn] = useState(false);
  const [joining, setJoining] = useState(false);

  const start = () => {
    if (syncConfigured && !account) setSigningIn(true);
    else onStart();
  };

  return (
    <div className="device welcome">
      <div className="welcome-body">
        <div className="mark big-mark">
          {en.brand.first}
          <span>{en.brand.second}</span>
        </div>
        <p className="welcome-line">{en.welcome.tagline}</p>

        <div className="welcome-slice">
          <CheeseToast />
        </div>
      </div>

      <div className="welcome-foot">
        {notFound && <p className="problem">{en.join.notFound}</p>}
        {account && <p className="empty">{en.signIn.signedInAs(account.email ?? '')}</p>}

        <button className="close" type="button" onClick={start}>
          {en.welcome.start}
        </button>

        <button className="ghost" type="button" onClick={() => setJoining(true)}>
          {en.welcome.join}
        </button>

        {account ? (
          <button className="ghost" type="button" onClick={() => setSigningIn(true)}>
            {en.signIn.signedInTitle}
          </button>
        ) : (
          <p className="empty welcome-note">{en.welcome.signInFirst}</p>
        )}
      </div>

      <JoinSheet open={joining} onClose={() => setJoining(false)} />

      {/* Starting a family while signed out would leave it on this phone with a
          link nobody else could open, so sign-in comes first. */}
      <SignInSheet
        open={signingIn}
        account={account}
        onClose={() => {
          setSigningIn(false);
          if (account) onStart();
        }}
      />
    </div>
  );
}
