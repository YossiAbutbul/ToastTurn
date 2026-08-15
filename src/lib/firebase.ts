import type { Firestore } from 'firebase/firestore';

type FirestoreModule = typeof import('firebase/firestore');

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/** No keys, no sync. The app stays exactly as it was: local and offline. */
export const syncConfigured = Boolean(config.apiKey && config.projectId && config.appId);

export type Remote = { db: Firestore; fs: FirestoreModule; uid: string };

let pending: Promise<Remote | null> | null = null;

/**
 * Firestore is ~500KB, so it is fetched only when a family is actually being
 * synced. Everything else in the app works without it.
 *
 * The anonymous sign-in is not an account — nobody types anything, and nothing
 * is asked for. It exists so the phone that created a family is the only one
 * the server will accept edits from.
 */
export function firestore(): Promise<Remote | null> {
  if (!syncConfigured) return Promise.resolve(null);
  if (pending) return pending;

  pending = (async () => {
    const [{ initializeApp }, fs, auth] = await Promise.all([
      import('firebase/app'),
      import('firebase/firestore'),
      import('firebase/auth'),
    ]);

    const app = initializeApp(config);
    // The persistent cache is what makes writes work in the kitchen dead-spot:
    // they land locally, show immediately, and replay themselves on reconnect.
    const db = fs.initializeFirestore(app, {
      localCache: fs.persistentLocalCache({ tabManager: fs.persistentMultipleTabManager() }),
    });

    const emulator = import.meta.env.VITE_FIREBASE_EMULATOR;
    if (emulator) {
      const [host, port] = String(emulator).split(':');
      fs.connectFirestoreEmulator(db, host, Number(port));
    }

    try {
      const credential = await auth.signInAnonymously(auth.getAuth(app));
      return { db, fs, uid: credential.user.uid };
    } catch {
      // Anonymous sign-in is switched off in the Firebase console. Sync can't
      // work without it, so the app falls back to being local to this phone.
      console.warn(
        'ToastTurn: turn on Anonymous sign-in (Firebase console → Authentication → ' +
          'Sign-in method) to sync between phones. Running local-only for now.',
      );
      return null;
    }
  })();

  return pending;
}

/** The id this device writes under. Null when sync is off. */
export async function currentUid(): Promise<string | null> {
  return (await firestore())?.uid ?? null;
}
