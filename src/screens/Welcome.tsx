import { useState } from 'react';
import { SignInSheet } from '../components/SignInSheet';
import { JoinSheet } from '../components/JoinSheet';
import { CheeseToast } from '../components/CheeseToast';
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
   * Only starting a rotation needs an account — someone has to own it. Opening
   * and joining stay open, so a guest can pull the lever without signing in.
   */
  const need = (what: Exclude<Pending, null>) => () => {
    if (what === 'start' && syncConfigured && !account) {
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
          <CheeseToast />
        </div>
      </div>

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

        <button className="ghost" type="button" onClick={need('join')}>
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
