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

let pending: Promise<{ db: Firestore; fs: FirestoreModule } | null> | null = null;

/**
 * Firestore is ~500KB, so it is fetched only when a family is actually being
 * synced. Everything else in the app works without it.
 */
export function firestore() {
  if (!syncConfigured) return Promise.resolve(null);
  if (pending) return pending;

  pending = (async () => {
    const [{ initializeApp }, fs] = await Promise.all([
      import('firebase/app'),
      import('firebase/firestore'),
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
    return { db, fs };
  })();

  return pending;
}
