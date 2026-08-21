import { useCallback, useEffect, useRef, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';

/** How often an app left open on the counter looks for a new deploy. */
const CHECK_MS = 30 * 60 * 1000;

/**
 * Whether a newer ToastTurn is sitting on the server waiting to be taken.
 *
 * The service worker fetches it and holds it; nothing changes under anyone
 * until they say so, so a deploy can never swap the app out mid-pull.
 *
 * Looking is not enough on its own. An app sitting in the background is frozen
 * — its timers stop and the message saying a new one had arrived is delivered
 * to nobody — so coming back to the front it would go on showing the old build
 * with nothing to say about it. So on the way back in it both asks the browser
 * to look and reads the registration itself: a worker already standing there
 * waiting is a new version, whoever it was announced to.
 */
export function useAppUpdate() {
  const [ready, setReady] = useState(false);
  const apply = useRef<((reload?: boolean) => Promise<void>) | null>(null);

  useEffect(() => {
    let timer: number | undefined;
    let onBack: (() => void) | null = null;

    /** A worker held back behind the one running the page is a new version. */
    const waiting = (registration: ServiceWorkerRegistration) => {
      if (registration.waiting && navigator.serviceWorker.controller) setReady(true);
    };

    apply.current = registerSW({
      onNeedRefresh: () => setReady(true),
      onRegisteredSW: (_url, registration) => {
        if (!registration) return;

        // One may have arrived and been installed while nobody was looking.
        waiting(registration);

        // And one may arrive while somebody is: it is not waiting the moment
        // it is found, only when it has finished installing.
        registration.addEventListener('updatefound', () => {
          const arriving = registration.installing;
          arriving?.addEventListener('statechange', () => waiting(registration));
        });

        const look = () => {
          if (!navigator.onLine) return;
          void registration.update().then(
            () => waiting(registration),
            // Offline again, or the server is having a moment. Nothing to say:
            // the app works either way, and it will ask again.
            () => undefined,
          );
        };

        timer = window.setInterval(look, CHECK_MS);

        onBack = () => {
          if (document.visibilityState !== 'visible') return;
          waiting(registration);
          look();
        };
        document.addEventListener('visibilitychange', onBack);
        // Coming back from the back/forward cache fires no visibility change.
        window.addEventListener('pageshow', onBack);
      },
    });

    return () => {
      window.clearInterval(timer);
      if (onBack) {
        document.removeEventListener('visibilitychange', onBack);
        window.removeEventListener('pageshow', onBack);
      }
    };
  }, []);

  const update = useCallback(() => {
    setReady(false);
    void apply.current?.(true);
  }, []);

  return { ready, update };
}
