import { useState } from 'react';
import { SignInSheet } from '../components/SignInSheet';
import { useAccount } from '../hooks/useAccount';
import { syncConfigured } from '../lib/firebase';
import { en } from '../i18n/en';
import './Welcome.css';

/**
 * The first screen on a phone with no family. Whoever runs the family signs in
 * here; everyone else never sees it, because a share link goes straight home.
 */
export function Welcome({ onStart }: { onStart: () => void }) {
  const { account } = useAccount();
  const [signingIn, setSigningIn] = useState(false);

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

        <div className="welcome-slice" aria-hidden="true">
          <svg viewBox="95 25 130 100">
            <path
              d="M102 120 V72 c0-19 11-31 28-33 4-13 21-17 31-8 10-9 27-5 29 8 19 2 28 14 28 33 v48 z"
              fill="var(--crust)"
              stroke="var(--ink)"
              strokeWidth="5"
              strokeLinejoin="round"
            />
            <path
              d="M111 120 V78 c0-15 9-25 23-27 3-10 17-14 26-6 8-7 21-3 26 6 14 2 23 12 23 27 v42 z"
              fill="var(--butter)"
            />
          </svg>
        </div>
      </div>

      <div className="welcome-foot">
        {account && <p className="empty">{en.signIn.signedInAs(account.email ?? '')}</p>}

        <button className="close" type="button" onClick={start}>
          {en.welcome.start}
        </button>

        {account ? (
          <button className="ghost" type="button" onClick={() => setSigningIn(true)}>
            {en.signIn.signedInTitle}
          </button>
        ) : (
          <p className="empty welcome-note">{en.welcome.signInFirst}</p>
        )}

        <p className="empty welcome-note">{en.welcome.joinNote}</p>
      </div>

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
