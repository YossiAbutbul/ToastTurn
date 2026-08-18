import { useState } from 'react';
import { SignInSheet } from '../components/SignInSheet';
import { JoinSheet } from '../components/JoinSheet';
import { ToastSlice } from '../components/ToastSlice';
import { Wordmark } from '../components/Wordmark';
import { useAccount } from '../hooks/useAccount';
import { signOut } from '../lib/auth';
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
  const { account, problem } = useAccount();
  const [signingIn, setSigningIn] = useState(false);
  const [joining, setJoining] = useState(false);
  const [pending, setPending] = useState<Pending>(null);
  /** The slice on the front toasts when you press it. It does nothing else. */
  const [toasted, setToasted] = useState(false);

  const run = (what: Exclude<Pending, null>) => {
    if (what === 'open') onOpen?.();
    if (what === 'start') onStart();
    if (what === 'join') setJoining(true);
  };

  /**
   * Starting a rotation is the one thing that needs a sign-in, because running
   * one has to outlive a phone being wiped. Opening a rotation this phone
   * already has, or joining one from a link, asks for nothing.
   */
  const need = (what: Exclude<Pending, null>) => () => {
    if (what === 'start' && syncConfigured && (!account || account.isAnonymous)) {
      setPending(what);
      setSigningIn(true);
      return;
    }
    run(what);
  };

  return (
    <div className="device welcome">
      <div className="welcome-body">
        {/* The same wordmark the top bar wears, written large: one name, one
            face, so the front door and the app read as the same thing. */}
        <div className="big-mark">
          <Wordmark />
        </div>
        <p className="welcome-line">{en.welcome.tagline}</p>

        <button
          className="welcome-slice"
          type="button"
          aria-label={toasted ? en.welcome.untoastIt : en.welcome.toastIt}
          aria-pressed={toasted}
          onClick={() => setToasted((was) => !was)}
        >
          <ToastSlice toasted={toasted} />
        </button>
      </div>

      <div className="welcome-foot">
        {notFound && <p className="problem">{en.join.notFound}</p>}

        {/* No account at all. Every button below would quietly do nothing, so
            it is said once, here, rather than left to be discovered. */}
        {problem && (
          <p className="problem">{en.signIn.noAccount(en.signIn.problem[problem])}</p>
        )}
        {account && !account.isAnonymous && (
          <p className="empty">
            {en.signIn.signedInAs(account.email ?? '')}{' '}
            {/* Said where being signed in is said: anywhere else and somebody
                is stuck as the wrong person with no way out. */}
            <button className="linkish" type="button" onClick={() => void signOut()}>
              {en.signIn.signOut}
            </button>
          </p>
        )}

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

        {(!account || account.isAnonymous) && (
          <p className="empty welcome-note">{en.welcome.signInFirst}</p>
        )}
      </div>

      <SignInSheet
        open={signingIn}
        account={account}
        onClose={() => setSigningIn(false)}
        onSignedIn={(signedIn) => {
          if (pending && !signedIn.isAnonymous) run(pending);
          setPending(null);
        }}
      />
      <JoinSheet open={joining} onClose={() => setJoining(false)} />
    </div>
  );
}
