import { useEffect, useRef, useState } from 'react';
import { SignInSheet } from '../components/SignInSheet';
import { JoinSheet } from '../components/JoinSheet';
import { KeyIcon } from '../components/KeyIcon';
import { ToastSlice } from '../components/ToastSlice';
import { Wordmark } from '../components/Wordmark';
import { useAccount } from '../hooks/useAccount';
import { signOut } from '../lib/auth';
import { syncConfigured } from '../lib/firebase';
import { ownedFamilies } from '../lib/remote';
import { replacePath } from '../lib/history';
import { pathForFamily } from '../lib/url';
import { en } from '../i18n/en';
import './Welcome.css';

type WelcomeProps = {
  onStart: () => void;
  /** Present when this phone already has a rotation to go back to. */
  onOpen?: () => void;
  notFound?: boolean;
  /** They arrived here by signing out, rather than by never signing in. */
  signedOut?: boolean;
};

type Pending = 'open' | 'start' | 'join' | null;

/**
 * The first screen on a phone with nothing open. Everything past it needs a
 * sign-in, so each action asks for one and then carries on where it left off.
 */
export function Welcome({ onStart, onOpen, notFound, signedOut }: WelcomeProps) {
  const { account, problem } = useAccount();
  const [signingIn, setSigningIn] = useState(false);
  const [joining, setJoining] = useState(false);
  const [pending, setPending] = useState<Pending>(null);
  /** The slice on the front toasts when you press it. It does nothing else. */
  const [toasted, setToasted] = useState(false);
  /**
   * Somebody signed out while this screen was up. Worth remembering for as
   * long as the screen lasts: the sentence under the buttons is a different
   * one for a phone that has just let go of an account than for one that
   * never had it.
   */
  const [signedOutHere, setSignedOutHere] = useState(false);

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

  /**
   * Which account has been asked about already. Asking is one read, but the
   * answer moves the app off this screen, so asking twice would fight itself.
   */
  const asked = useRef<string | null>(null);

  /**
   * A signed-in owner holding no rotation is somebody whose phone has been
   * wiped, or a fresh browser, or the dev server. They used to be shown the
   * front door and offered a *new* rotation, with the one they already run
   * sitting on the server the whole time - the account was a way of being
   * recognised and not a way back in. So the account is asked what it owns,
   * and the answer is put in the address bar, which is the same road every
   * share link takes: the joining screen, then the rotation.
   */
  useEffect(() => {
    if (!syncConfigured || !account || account.isAnonymous) return;
    // A rotation is already open on this phone; there is nothing to look for.
    if (onOpen) return;
    if (asked.current === account.uid) return;
    asked.current = account.uid;

    void ownedFamilies(account.uid)
      .then((ids) => {
        // More than one is possible and rare: the first opens, and the rest
        // are a tap away from settings once it has.
        if (ids.length > 0) return replacePath(pathForFamily(ids[0]));
        // Nothing of theirs up there. Whatever they were trying to do when
        // the sign-in interrupted them can go ahead now.
        if (pending) run(pending);
        setPending(null);
      })
      .catch(() => {
        // The question could not be asked - offline, or rules that have not
        // been deployed yet. Not worth a sentence: everything on this screen
        // still works, including the code and the link.
        asked.current = null;
      });
    // `run` and `pending` are read once the answer comes back, and neither is
    // what decides whether to ask: the account is, and asking twice for the
    // same one is what `asked` is for.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, onOpen]);

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
            <button
              className="linkish"
              type="button"
              onClick={() => {
                setSignedOutHere(true);
                void signOut();
              }}
            >
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

        {/* Signing out used to be a one-way door: every button here either
            asked for nothing or started something new, so whoever ran a
            rotation had no way back to the account that runs it. This is
            that way back, and it is on the front door because that is where
            signing out lands you. */}
        {syncConfigured && (!account || account.isAnonymous) && (
          <button
            className="welcome-signin"
            type="button"
            onClick={() => {
              setPending(null);
              setSigningIn(true);
            }}
          >
            <KeyIcon />
            {en.welcome.signIn}
          </button>
        )}

        <button className="welcome-plain" type="button" onClick={need('join')}>
          {en.welcome.join}
        </button>

        {/* Only where there is a sign-in to be had. Without keys there is no
            account to want, and the line sent people looking for one. */}
        {syncConfigured && (!account || account.isAnonymous) && (
          <p className="empty welcome-note">
            {signedOut || signedOutHere ? en.welcome.signInBack : en.welcome.signInFirst}
          </p>
        )}
      </div>

      <SignInSheet
        open={signingIn}
        account={account}
        onClose={() => setSigningIn(false)}
        onSignedIn={(signedIn) => {
          // What happens next is not decided here. Signing in changes the
          // account, and the first thing that does is ask the server which
          // rotations belong to it - starting a new one is what happens when
          // the answer is none.
          if (signedIn.isAnonymous) setPending(null);
        }}
      />
      <JoinSheet open={joining} onClose={() => setJoining(false)} />
    </div>
  );
}
