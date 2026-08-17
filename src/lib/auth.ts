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
        return asAccount(signedIn.user);
      }
    }

    // Already signed in as this very account: nothing to do but say so.
    if (/provider-already-linked/.test(code) && current) return asAccount(current);

    if (/popup-closed-by-user/.test(code)) throw error;
    if (!/popup-blocked|operation-not-supported/.test(code)) throw error;

    await ready.fns.signInWithRedirect(ready.auth, provider);
    return 'redirecting';
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
export function watchAccount(onChange: (account: Account | null) => void): () => void {
  let stop: (() => void) | null = null;
  let cancelled = false;

  void (async () => {
    const ready = await firebaseAuth();
    if (!ready || cancelled) {
      onChange(null);
      return;
    }

    // Not onAuthStateChanged: linking Google onto the anonymous account keeps
    // the same user, so that one never fires and the app would go on believing
    // this phone was still anonymous. The token does change, and this hears it.
    stop = ready.fns.onIdTokenChanged(ready.auth, (user) => {
      if (user) return onChange(asAccount(user));
      // Nobody yet. Fetching one is silent, and lands back here as a user.
      void ready.fns.signInAnonymously(ready.auth).catch(() => onChange(null));
    });
    if (cancelled) stop();
  })();

  return () => {
    cancelled = true;
    stop?.();
  };
}

/**
 * Turns Firebase's error codes into something worth reading. "Not configured"
 * is its own case: without keys there is no sign-in to reach, and saying
 * "you're offline" sends people to check their wifi for nothing.
 */
export function signInProblem(error: unknown): 'credentials' | 'offline' | 'setup' | 'other' {
  const code = (error as { code?: string })?.code ?? '';
  const message = (error as Error)?.message ?? '';

  if (message === 'not-configured') return 'setup';
  // The provider is switched off in the console. Nothing typed will fix it.
  if (/admin-restricted-operation/.test(code)) return 'setup';
  if (/invalid-credential|wrong-password|user-not-found|invalid-email/.test(code)) return 'credentials';
  if (/operation-not-allowed|configuration-not-found|api-key-not-valid/.test(code)) return 'setup';
  if (/network-request-failed/.test(code)) return 'offline';
  return 'other';
}
