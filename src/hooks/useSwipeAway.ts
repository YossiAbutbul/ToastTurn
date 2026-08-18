import { useCallback, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';

/** How far it has to go before letting go sends it away. */
const AWAY = 70;
/** Past this the finger is sliding, not tapping, and any button under it lets go. */
const SLOP = 6;

/**
 * Slide a thing off the screen to be rid of it.
 *
 * Sideways rather than up: it sits under the top bar, and a drag upwards on a
 * phone is how people scroll. Pointer events, so a mouse and a thumb take the
 * same path.
 */
export function useSwipeAway(onAway: () => void) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  /** Held in a ref as well as in state: a drag that starts and moves inside
      one tick would read the state from before the press. */
  const down = useRef(false);
  const from = useRef(0);
  const at = useRef(0);
  /** Whether this gesture has become a slide, so a tap is not read out of it. */
  const slid = useRef(false);

  const onPointerDown = useCallback((e: ReactPointerEvent<HTMLElement>) => {
    from.current = e.clientX;
    at.current = 0;
    slid.current = false;
    down.current = true;
    setDragging(true);
    // Capture keeps the drag alive when the finger leaves the bar. It throws
    // if the pointer is not actually down, which nothing here should hang on.
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // no capture, the drag still follows while the pointer is over it
    }
  }, []);

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (!down.current) return;
      const moved = e.clientX - from.current;
      if (Math.abs(moved) > SLOP) slid.current = true;
      at.current = moved;
      setOffset(moved);
    },
    [],
  );

  const release = useCallback(() => {
    down.current = false;
    setDragging(false);
    if (Math.abs(at.current) > AWAY) return onAway();
    at.current = 0;
    setOffset(0);
    // The click lands right after this, so the flag has to outlive the
    // release and no longer. Left standing it swallowed the next press that
    // arrived without a pointer under it - the keyboard's, for one.
    window.setTimeout(() => {
      slid.current = false;
    }, 0);
  }, [onAway]);

  return {
    offset,
    dragging,
    /** True while the last gesture was a slide, so a button can ignore its click. */
    slid,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: release,
      onPointerCancel: release,
    },
  };
}
