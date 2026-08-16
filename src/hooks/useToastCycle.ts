import { useCallback, useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

/** Slice positions, in SVG units. */
export const SLICE_REST = 0;
export const SLICE_DEEP = 78;
/**
 * Where the slice comes to rest after the pop: back where it started. The
 * prototype's -56 throws it clear of the toaster and leaves it floating with a
 * gap under it, so the jump does the popping and the slice settles home.
 */
export const SLICE_POP = SLICE_REST;
/**
 * The top of the jump. The slice is knocked up out of the slot for a moment
 * and drops back to where it started, the way toast actually comes out of a
 * toaster. Any higher and it leaves the toaster behind and floats.
 */
const SLICE_HOP = -30;
/**
 * Where the fresh slice waits before springing up: low enough that its top is
 * under the chrome cap, high enough that its bottom does not appear under the
 * toaster's feet on the way back.
 */
const SLICE_BELOW = 92;

const TOASTING_MS = 1050;
/**
 * How long the browned slice sits there before the next person's goes in. It
 * is the moment the whole pull is for, so it is not rushed off the screen.
 */
const RESET_MS = 1500;
/** How long the slice spends in the air before it falls back into the slot. */
const HOP_MS = 200;
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
  const [hop, setHop] = useState(false); // slice is in the air, on its way up
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
      setSteamKey((k) => k + 1);
      onPopRef.current();

      if (reduced) {
        setSliceY(SLICE_POP);
      } else {
        // Up hard, then let it drop back and settle into the slot.
        setHop(true);
        setSliceY(SLICE_HOP);
        after(HOP_MS, () => {
          setHop(false);
          setSliceY(SLICE_POP);
        });
      }

      after(resetMs, () => {
        setSnap(true);
        setSliceY(SLICE_BELOW);
        setBaked(false);
        // A timer, not requestAnimationFrame: rAF is suspended while the tab is
        // hidden, and locking the phone mid-cycle used to strand the slice below
        // the slot with the lever disabled for good.
        after(SNAP_MS, () => {
          setSnap(false);
          setHop(false);
          setSliceY(SLICE_REST);
          setPhase('idle');
        });
      });
    });
  }, [after, phase, reduced]);

  return { phase, sliceY, snap, hop, baked, needle, steamKey, start, busy: phase !== 'idle' };
}
