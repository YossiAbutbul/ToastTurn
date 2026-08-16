/**
 * The address bar, as something React can read and subscribe to. The family
 * code lives in the path, so a rewrite has to reach whatever is reading it;
 * `replaceState` alone tells nobody.
 */
const CHANGED = 'toastturn:path';

export function currentPath(): string {
  return typeof window === 'undefined' ? '' : window.location.pathname;
}

export function replacePath(to: string): void {
  if (typeof window === 'undefined' || currentPath() === to) return;
  window.history.replaceState(null, '', to);
  window.dispatchEvent(new Event(CHANGED));
}

export function subscribePath(onChange: () => void): () => void {
  window.addEventListener(CHANGED, onChange);
  window.addEventListener('popstate', onChange);
  return () => {
    window.removeEventListener(CHANGED, onChange);
    window.removeEventListener('popstate', onChange);
  };
}
