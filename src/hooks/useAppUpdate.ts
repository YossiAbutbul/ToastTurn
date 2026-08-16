import { useCallback, useEffect, useRef, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';

/** How often an app left open on the counter looks for a new deploy. */
const CHECK_MS = 30 * 60 * 1000;

/**
 * Whether a newer ToastTurn is sitting on the server waiting to be taken.
 *
 * The service worker fetches it and holds it; nothing changes under anyone
 * until they say so, so a deploy can never swap the app out mid-pull. A phone
 * that stays open is nudged to look every half hour and whenever it comes back
 * to the front, or an installed app could sit on an old build for days.
 */
export function useAppUpdate() {
  const [ready, setReady] = useState(false);
  const apply = useRef<((reload?: boolean) => Promise<void>) | null>(null);

  useEffect(() => {
    let timer: number | undefined;
    let onShow: (() => void) | null = null;

    apply.current = registerSW({
      onNeedRefresh: () => setReady(true),
      onRegisteredSW: (_url, registration) => {
        if (!registration) return;
        const look = () => {
          if (navigator.onLine) void registration.update();
        };
        timer = window.setInterval(look, CHECK_MS);
        onShow = () => {
          if (document.visibilityState === 'visible') look();
        };
        document.addEventListener('visibilitychange', onShow);
      },
    });

    return () => {
      window.clearInterval(timer);
      if (onShow) document.removeEventListener('visibilitychange', onShow);
    };
  }, []);

  const update = useCallback(() => {
    setReady(false);
    void apply.current?.(true);
  }, []);

  return { ready, update };
}
