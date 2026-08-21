import { useEffect, useState } from 'react';
import { CRUMB_LIFE_MS, crumbFade, seedCrumbs, stepCrumbs } from '../lib/crumbs';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';
import type { Crumb } from '../lib/crumbs';

/**
 * A handful of crumbs, thrown every time `trigger` changes and swept up a
 * second and a half later. Nothing at all when the phone asks for less
 * movement: crumbs are the one thing on the screen that says nothing.
 */
export function useCrumbFly(trigger: number): { crumbs: Crumb[]; fade: number } {
  const reduced = usePrefersReducedMotion();
  const [crumbs, setCrumbs] = useState<Crumb[]>([]);
  const [fade, setFade] = useState(1);

  useEffect(() => {
    if (trigger <= 0 || reduced) return;

    let live = seedCrumbs();
    let frame = 0;
    let last: number | undefined;
    let started: number | undefined;

    // The handful goes on screen from the first frame rather than from here:
    // state set in the body of an effect costs a render before anything has
    // moved, and the linter is right to say so.
    const tick = (now: number) => {
      if (started === undefined) {
        started = now;
        setFade(1);
      }
      const age = now - started;
      if (age >= CRUMB_LIFE_MS) {
        setCrumbs([]);
        return;
      }

      // Stepped by the time that actually passed, so a phone drawing at 120Hz
      // throws them the same distance as one drawing at 60.
      live = stepCrumbs(live, last === undefined ? 1 : Math.min(3, (now - last) / 16));
      last = now;
      setCrumbs(live);
      setFade(crumbFade(age));
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);

    // A broom, for the pull that ends with the phone going in a pocket:
    // requestAnimationFrame is suspended while the tab is hidden, so without
    // this the crumbs would still be lying there when it came back out.
    const broom = window.setTimeout(() => setCrumbs([]), CRUMB_LIFE_MS + 200);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(broom);
      setCrumbs([]);
    };
  }, [trigger, reduced]);

  return { crumbs, fade };
}
