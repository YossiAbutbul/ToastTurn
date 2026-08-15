import { useState } from 'react';
import { SignInSheet } from '../components/SignInSheet';
import { JoinSheet } from '../components/JoinSheet';
import { ToastSlice } from '../components/ToastSlice';
import { useAccount } from '../hooks/useAccount';
import { syncConfigured } from '../lib/firebase';
import { en } from '../i18n/en';
import './Welcome.css';

type WelcomeProps = {
  onStart: () => void;
  /** Present when this phone already has a rotation to go back to. */
  onOpen?: () => void;
  notFound?: boolean;
};

type Pending = 'open' | 'start' | 'join' | null;

/**
 * The first screen on a phone with nothing open. Everything past it needs a
 * sign-in, so each action asks for one and then carries on where it left off.
 */
export function Welcome({ onStart, onOpen, notFound }: WelcomeProps) {
  const { account } = useAccount();
  const [signingIn, setSigningIn] = useState(false);
  const [joining, setJoining] = useState(false);
  const [pending, setPending] = useState<Pending>(null);

  const run = (what: Exclude<Pending, null>) => {
    if (what === 'open') onOpen?.();
    if (what === 'start') onStart();
    if (what === 'join') setJoining(true);
  };

  /**
   * Everything here needs an account. Signing out has to mean something, so
   * even the rotation this phone already holds asks first. A guest who was sent
   * the link still opens it straight from the link, lever and all.
   */
  const need = (what: Exclude<Pending, null>) => () => {
    if (syncConfigured && !account) {
      setPending(what);
      setSigningIn(true);
      return;
    }
    run(what);
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
          <ToastSlice />
        </div>
      </div>

      {/* the counter's edge: one curve peaking in the middle, under the toast,
          with no outline — the two colours simply meet */}
      <svg className="welcome-wave" viewBox="0 0 390 200" preserveAspectRatio="none" aria-hidden="true">
        <path className="welcome-wave-fill" d="M0 100 C70 96 120 36 195 36 C270 36 320 96 390 100 L390 200 L0 200 Z" />
      </svg>

      <div className="welcome-foot">
        {notFound && <p className="problem">{en.join.notFound}</p>}
        {account && <p className="empty">{en.signIn.signedInAs(account.email ?? '')}</p>}

        {onOpen ? (
          <>
            <button className="close" type="button" onClick={need('open')}>
              {en.welcome.open}
            </button>
            <button className="ghost" type="button" onClick={need('start')}>
              {en.welcome.start}
            </button>
          </>
        ) : (
          <button className="close" type="button" onClick={need('start')}>
            {en.welcome.start}
          </button>
        )}

        <button className="welcome-plain" type="button" onClick={need('join')}>
          {en.welcome.join}
        </button>

        {!account && <p className="empty welcome-note">{en.welcome.signInFirst}</p>}
      </div>

      <SignInSheet
        open={signingIn}
        account={account}
        onClose={() => {
          setSigningIn(false);
          if (account && pending) run(pending);
          setPending(null);
        }}
      />
      <JoinSheet open={joining} onClose={() => setJoining(false)} />
    </div>
  );
}
