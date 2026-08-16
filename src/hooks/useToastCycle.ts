import { useCallback, useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

/** Slice positions, in SVG units. */
export const SLICE_REST = 0;
export const SLICE_DEEP = 78;
/**
 * The prototype pops to -56, which throws the slice clear of the toaster and
 * leaves it floating with a gap under it. -16 keeps the bottom of the slice
 * behind the chrome cap (y 102), so it still reads as seated in the slot.
 */
export const SLICE_POP = -16;
/** Off the bottom of the slot, where the fresh slice jumps to before springing up. */
const SLICE_BELOW = 140;

const TOASTING_MS = 1050;
const RESET_MS = 650;
/** Long enough for one paint at the reload position, short enough to be unseen. */
const SNAP_MS = 20;
const NEEDLE_MS = 55;
/** The dial is a timer: it winds down one full turn and stops at the top. */
const NEEDLE_SWEEP = 360;

export type CyclePhase = 'idle' | 'toasting' | 'popped';

type Options = {
  /** Runs once per cycle, the moment the slice pops. */
  onPop: () => void;
};

/**
 * The toast cycle: drop, bake, pop, reload. Owns every timer and every
 * position the slice takes, so the SVG stays declarative.
 */
export function useToastCycle({ onPop }: Options) {
  const reduced = usePrefersReducedMotion();
  const [phase, setPhase] = useState<CyclePhase>('idle');
  const [sliceY, setSliceY] = useState(SLICE_REST);
  const [snap, setSnap] = useState(false); // slice moves with no transition
  const [baked, setBaked] = useState(false);
  const [needle, setNeedle] = useState(0);
  const [steamKey, setSteamKey] = useState(0);

  const timers = useRef<number[]>([]);
  const spin = useRef<number | undefined>(undefined);
  const onPopRef = useRef(onPop);
  useEffect(() => {
    onPopRef.current = onPop;
  });

  const clearAll = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (spin.current !== undefined) clearInterval(spin.current);
    spin.current = undefined;
  }, []);

  useEffect(() => clearAll, [clearAll]);

  const after = useCallback((ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);

  const start = useCallback(() => {
    if (phase !== 'idle') return;
    const toastMs = reduced ? 60 : TOASTING_MS;
    const resetMs = reduced ? 40 : RESET_MS;

    setPhase('toasting');
    setSliceY(SLICE_DEEP);
    setBaked(true);

    if (!reduced) {
      // The step is cut from the bake, so the needle arrives at the top exactly
      // as the toast pops rather than sweeping on past where it started.
      const steps = Math.max(1, Math.round(toastMs / NEEDLE_MS));
      let tick = 0;
      spin.current = window.setInterval(() => {
        tick += 1;
        setNeedle(Math.min(NEEDLE_SWEEP, (tick * NEEDLE_SWEEP) / steps));
      }, NEEDLE_MS);
    }

    after(toastMs, () => {
      if (spin.current !== undefined) clearInterval(spin.current);
      spin.current = undefined;
      setNeedle(0);
      setPhase('popped');
      setSliceY(SLICE_POP);
      setSteamKey((k) => k + 1);
      onPopRef.current();

      after(resetMs, () => {
        setSnap(true);
        setSliceY(SLICE_BELOW);
        setBaked(false);
        // A timer, not requestAnimationFrame: rAF is suspended while the tab is
        // hidden, and locking the phone mid-cycle used to strand the slice below
        // the slot with the lever disabled for good.
        after(SNAP_MS, () => {
          setSnap(false);
          setSliceY(SLICE_REST);
          setPhase('idle');
        });
      });
    });
  }, [after, phase, reduced]);

  return { phase, sliceY, snap, baked, needle, steamKey, start, busy: phase !== 'idle' };
}
