import type { FirebaseApp } from 'firebase/app';
import type { Firestore } from 'firebase/firestore';

type FirestoreModule = typeof import('firebase/firestore');
type AuthModule = typeof import('firebase/auth');

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/** No keys, no sync. The app stays exactly as it was: local and offline. */
export const syncConfigured = Boolean(config.apiKey && config.projectId && config.appId);

/**
 * App Check, if a site key was given.
 *
 * The Firebase keys are in the bundle - they have to be, the browser does the
 * talking - so anyone can read them off the page and call the project from
 * anywhere. The rules still hold, and they are what actually protects the
 * data; what this adds is that the caller has to be this app in a real
 * browser, which is the difference between a rotation nobody can read and a
 * script minting accounts all afternoon.
 *
 * Left out, everything works exactly as before.
 */
const appCheckKey = import.meta.env.VITE_FIREBASE_APPCHECK_KEY;

export type Remote = { db: Firestore; fs: FirestoreModule };

let appPromise: Promise<FirebaseApp> | null = null;
let remotePromise: Promise<Remote | null> | null = null;
let authPromise: Promise<{ auth: ReturnType<AuthModule['getAuth']>; fns: AuthModule } | null> | null =
  null;

function getApp(): Promise<FirebaseApp> {
  if (!appPromise) {
    appPromise = (async () => {
      const { initializeApp } = await import('firebase/app');
      const app = initializeApp(config);

      // Before anything asks for a token or a document: App Check attaches to
      // the app, and whatever was set up first would otherwise go unattested.
      if (appCheckKey) {
        const { initializeAppCheck, ReCaptchaV3Provider } = await import('firebase/app-check');

        // On a dev machine there is no reCAPTCHA to pass, so the SDK prints a
        // token to register once in the console and localhost is let through.
        if (import.meta.env.DEV) {
          (globalThis as { FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean }).FIREBASE_APPCHECK_DEBUG_TOKEN =
            true;
        }

        initializeAppCheck(app, {
          provider: new ReCaptchaV3Provider(appCheckKey),
          isTokenAutoRefreshEnabled: true,
        });
      }

      return app;
    })();
  }
  return appPromise;
}

/**
 * Firestore is ~500KB, so it is fetched only when a family is actually being
 * synced. Everything else in the app works without it.
 */
export function firestore(): Promise<Remote | null> {
  if (!syncConfigured) return Promise.resolve(null);
  if (remotePromise) return remotePromise;

  remotePromise = (async () => {
    const [app, fs] = await Promise.all([getApp(), import('firebase/firestore')]);

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

  return remotePromise;
}

/** The sign-in used by whoever runs the family. Nobody else ever needs it. */
export function firebaseAuth() {
  if (!syncConfigured) return Promise.resolve(null);
  if (authPromise) return authPromise;

  authPromise = (async () => {
    const [app, fns] = await Promise.all([getApp(), import('firebase/auth')]);
    return { auth: fns.getAuth(app), fns };
  })();

  return authPromise;
}
