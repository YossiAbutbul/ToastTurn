import { firebaseAuth } from './firebase';

export type Account = {
  uid: string;
  email: string | null;
  /**
   * True for the account every phone gets by itself. It is a real account as
   * far as the server is concerned, and no account at all as far as the person
   * holding the phone is concerned: they were never asked for anything.
   */
  isAnonymous: boolean;
};

/**
 * The anonymous sign-in, in flight.
 *
 * Several parts of the app watch the account, each with its own listener, and
 * each would otherwise ask for an account of its own the moment it saw none -
 * minting a fresh one every time, three deep on a first load. They all wait on
 * the same request instead.
 */
let anonymous: Promise<unknown> | null = null;

const asAccount = (user: {
  uid: string;
  email: string | null;
  isAnonymous: boolean;
}): Account => ({ uid: user.uid, email: user.email, isAnonymous: user.isAnonymous });

/**
 * One tap, and only for whoever runs a rotation. Popups are blocked in some
 * installed PWAs, so it falls back to a full-page redirect and finishes when
 * the app reloads.
 *
 * The phone already has an anonymous account by the time this is reached, so
 * Google is linked onto it rather than signed into: same uid, so the turns,
 * the orders and the person this phone had claimed all survive. An account
 * that has already been somewhere else signs in normally, and the anonymous
 * one is left behind.
 */
export async function signInWithGoogle(): Promise<Account | 'redirecting'> {
  const ready = await firebaseAuth();
  if (!ready) throw new Error('not-configured');

  const provider = new ready.fns.GoogleAuthProvider();
  const current = ready.auth.currentUser;

  try {
    if (current?.isAnonymous) {
      const linked = await ready.fns.linkWithPopup(current, provider);
      // Linking keeps the session it was linked onto, so the token in hand
      // still describes an account with no provider on it - and the server
      // decides who may run a rotation by reading exactly that. Asking for a
      // fresh one is what makes the sign-in true as far as the rules go.
      await linked.user.getIdToken(true);
      return asAccount(linked.user);
    }
    const credential = await ready.fns.signInWithPopup(ready.auth, provider);
    return asAccount(credential.user);
  } catch (error) {
    const code = (error as { code?: string })?.code ?? '';

    // That Google account is already somebody here. Signing in as them is the
    // right answer - the anonymous account was never anything to lose - but it
    // has to be done with the credential the failure carried. Opening a second
    // popup is outside the tap that opened the first, and the browser blocks
    // it, which looked from the outside like the button doing nothing at all.
    if (/credential-already-in-use|email-already-in-use/.test(code)) {
      const held = ready.fns.GoogleAuthProvider.credentialFromError(
        error as Parameters<typeof ready.fns.GoogleAuthProvider.credentialFromError>[0],
      );
      if (held) {
        const signedIn = await ready.fns.signInWithCredential(ready.auth, held);
        await signedIn.user.getIdToken(true);
        return asAccount(signedIn.user);
      }
    }

    reportSignInError('signing in with Google', error);

    // Already signed in as this very account: nothing to do but say so.
    if (/provider-already-linked/.test(code) && current) return asAccount(current);

    if (/popup-closed-by-user/.test(code)) throw error;
    if (!/popup-blocked|operation-not-supported/.test(code)) throw error;

    await ready.fns.signInWithRedirect(ready.auth, provider);
    return 'redirecting';
  }
}

/**
 * Give up the account this phone was handed, for good.
 *
 * Only ever its own: deleting anybody else's needs the admin key, which is a
 * server, which this app has not got. So a rotation being cleared cannot reach
 * out and tidy up after the phones that were in it - each one lets go of its
 * own account the next time it opens and finds the rotation gone. What that
 * buys is a bound: one account per phone still in use, rather than another
 * left behind every time somebody starts over.
 *
 * A real sign-in is left alone. That account is the way back into a rotation
 * and is not this app's to throw away.
 */
export async function dropAnonymousAccount(): Promise<void> {
  const ready = await firebaseAuth();
  const user = ready?.auth.currentUser;
  if (!user?.isAnonymous) return;

  try {
    await user.delete();
  } catch (error) {
    // Nothing to do about it, and nothing that needs saying to anyone: a fresh
    // account arrives by itself either way.
    reportSignInError('letting go of this phone’s account', error);
  }
}

export async function signOut(): Promise<void> {
  const ready = await firebaseAuth();
  if (!ready) return;
  await ready.fns.signOut(ready.auth);
}

/**
 * Calls back with the account, or null, and keeps calling on every change.
 *
 * A phone with nobody on it is given an anonymous account rather than being
 * asked for one. Nothing is typed and no screen is shown; it exists so the
 * server has somebody to check when this phone says which person it is and
 * what they want on their toast.
 */
export function watchAccount(
  onChange: (account: Account | null) => void,
  /**
   * Why this phone has no account. Being given one is silent when it works,
   * and used to be silent when it did not: nothing could be read or written,
   * every button did nothing, and the screen said none of it.
   */
  onProblem?: (problem: SignInProblem) => void,
): () => void {
  let stop: (() => void) | null = null;
  let cancelled = false;

  void (async () => {
    const ready = await firebaseAuth();
    if (!ready || cancelled) {
      onChange(null);
      return;
    }

    /**
     * Nobody yet. Fetching one is silent, and lands back here as a user.
     *
     * One request between all the listeners, but each of them waits on it
     * separately: whichever asked first would otherwise be the only one told
     * it failed, and the rest would sit there for good with no account and
     * nothing to show for it - which is how a failure to sign in came out as
     * a blank screen rather than a sentence.
     */
    const beAnonymous = () => {
      if (!anonymous) anonymous = ready.fns.signInAnonymously(ready.auth);
      return anonymous.catch((error) => {
        anonymous = null;
        reportSignInError('giving this phone an account', error);
        onChange(null);
        onProblem?.(signInProblem(error));
      });
    };

    // Not onAuthStateChanged: linking Google onto the anonymous account keeps
    // the same user, so that one never fires and the app would go on believing
    // this phone was still anonymous. The token does change, and this hears it.
    stop = ready.fns.onIdTokenChanged(
      ready.auth,
      (user) => {
        if (user) {
          anonymous = null;
          return onChange(asAccount(user));
        }
        void beAnonymous();
      },
      // The account this phone was holding cannot be refreshed: deleted from
      // the project, or disabled. Firebase goes on asking for a token it will
      // never get, so the app sits there with no account and no way to a new
      // one. Letting the dead one go and taking a fresh anonymous account is
      // the only way out, and costs nothing: turns and orders are keyed by
      // person, so re-tapping a name gets everything back.
      (error) => {
        reportSignInError('refreshing the account this phone was holding', error);
        void ready.fns
          .signOut(ready.auth)
          .then(beAnonymous)
          .catch(() => {
            onChange(null);
            onProblem?.(signInProblem(error));
          });
      },
    );
    if (cancelled) stop();
  })();

  return () => {
    cancelled = true;
    stop?.();
  };
}

export type SignInProblem =
  /** They shut the Google window themselves. Not worth saying anything about. */
  | 'cancelled'
  | 'blocked'
  | 'domain'
  | 'offline'
  | 'setup'
  | 'other';

/**
 * The whole error, in the console, every time.
 *
 * The screen gets a sentence a person can act on, which means it cannot carry
 * the code, and the code is the only thing that says which of a dozen setup
 * switches is off. So it goes here as well, where whoever is fixing it will
 * look, and stays out of the copy.
 */
function reportSignInError(what: string, error: unknown): void {
  const code = (error as { code?: string })?.code;
  console.error(`[ToastTurn] ${what} failed${code ? `: ${code}` : ''}`, error);
}

/**
 * Turns Firebase's error codes into something worth reading. "Not configured"
 * is its own case: without keys there is no sign-in to reach, and saying
 * "you're offline" sends people to check their wifi for nothing.
 */
export function signInProblem(error: unknown): SignInProblem {
  const code = (error as { code?: string })?.code ?? '';
  const message = (error as Error)?.message ?? '';

  if (message === 'not-configured') return 'setup';
  if (/popup-closed-by-user|cancelled-popup-request|user-cancelled/.test(code)) return 'cancelled';
  if (/popup-blocked/.test(code)) return 'blocked';
  if (/unauthorized-domain/.test(code)) return 'domain';
  // A provider switched off in the console. Nothing typed will fix it.
  if (/admin-restricted-operation|operation-not-allowed|configuration-not-found|api-key-not-valid/.test(code)) {
    return 'setup';
  }
  if (/network-request-failed|timeout/.test(code)) return 'offline';
  return 'other';
}
