import { firebaseAuth } from './firebase';

export type Account = { uid: string; email: string | null };

/**
 * The family's owner signs in with an email and a password. Everyone else uses
 * the app without signing in at all — the link is enough to read the family and
 * to say the toast got made.
 */
export async function signIn(email: string, password: string): Promise<Account> {
  const ready = await firebaseAuth();
  if (!ready) throw new Error('offline');

  const credential = await ready.fns.signInWithEmailAndPassword(ready.auth, email, password);
  return { uid: credential.user.uid, email: credential.user.email };
}

/**
 * One tap instead of a password. Popups are blocked in some installed PWAs, so
 * it falls back to a full-page redirect and finishes when the app reloads.
 */
export async function signInWithGoogle(): Promise<Account | 'redirecting'> {
  const ready = await firebaseAuth();
  if (!ready) throw new Error('offline');

  const provider = new ready.fns.GoogleAuthProvider();
  try {
    const credential = await ready.fns.signInWithPopup(ready.auth, provider);
    return { uid: credential.user.uid, email: credential.user.email };
  } catch (error) {
    const code = (error as { code?: string })?.code ?? '';
    if (!/popup-blocked|popup-closed-by-user|operation-not-supported/.test(code)) throw error;
    if (/popup-closed-by-user/.test(code)) throw error;
    await ready.fns.signInWithRedirect(ready.auth, provider);
    return 'redirecting';
  }
}

export async function signOut(): Promise<void> {
  const ready = await firebaseAuth();
  if (!ready) return;
  await ready.fns.signOut(ready.auth);
}

/** Calls back with the account, or null, and keeps calling on every change. */
export function watchAccount(onChange: (account: Account | null) => void): () => void {
  let stop: (() => void) | null = null;
  let cancelled = false;

  void (async () => {
    const ready = await firebaseAuth();
    if (!ready || cancelled) {
      onChange(null);
      return;
    }
    stop = ready.fns.onAuthStateChanged(ready.auth, (user) => {
      onChange(user ? { uid: user.uid, email: user.email } : null);
    });
    if (cancelled) stop();
  })();

  return () => {
    cancelled = true;
    stop?.();
  };
}

/** Turns Firebase's error codes into something worth reading. */
export function signInProblem(error: unknown): 'credentials' | 'offline' | 'other' {
  const code = (error as { code?: string })?.code ?? '';
  if (/invalid-credential|wrong-password|user-not-found|invalid-email/.test(code)) return 'credentials';
  if (/network-request-failed/.test(code) || (error as Error)?.message === 'offline') return 'offline';
  return 'other';
}
