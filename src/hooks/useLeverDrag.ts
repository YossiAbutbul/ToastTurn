import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, KeyboardEvent as ReactKeyboardEvent, RefObject } from 'react';

/** The lever travels 0–46 SVG units. */
export const LEVER_MAX = 46;
/** Released past this fraction of the travel, it commits. Below, it springs back. */
export const LEVER_COMMIT = 0.65;

/** SVG viewBox height, used to convert client pixels to SVG units. */
const VIEWBOX_HEIGHT = 350;

export type LeverState = 'idle' | 'pulling' | 'ready';

type Options = {
  /** The <svg> the lever lives in, supplies the rect for the pixel → unit conversion. */
  svgRef: RefObject<SVGSVGElement | null>;
  disabled?: boolean;
  onCommit: () => void;
};

/**
 * The drag is tracked on the window rather than on the lever itself.
 * Safari's pointer capture is unreliable on an SVG <g>, and a finger that
 * slides off the knob would otherwise stop reporting, leaving the lever stuck
 * half pulled. The window hears the whole gesture wherever it wanders.
 */
export function useLeverDrag({ svgRef, disabled, onCommit }: Options) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startY = useRef(0);
  const current = useRef(0);
  const pointer = useRef<number | null>(null);

  // Held in a ref so the window listeners, bound once per drag, always call the
  // latest one instead of the closure they were created with.
  const commit = useRef(onCommit);
  useEffect(() => {
    commit.current = onCommit;
  }, [onCommit]);

  const toSvgUnits = useCallback(
    (clientY: number) => {
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect || rect.height === 0) return 0;
      return (clientY - rect.top) * (VIEWBOX_HEIGHT / rect.height);
    },
    [svgRef],
  );

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<SVGGElement>) => {
      if (disabled) return;
      // Safari ignores touch-action on SVG elements, so the gesture has to be
      // claimed here too or the page takes it as a scroll and cancels the drag.
      e.preventDefault();
      pointer.current = e.pointerId;
      startY.current = toSvgUnits(e.clientY);
      current.current = 0;
      setDragging(true);
    },
    [disabled, toSvgUnits],
  );

  useEffect(() => {
    if (!dragging) return;

    const move = (e: PointerEvent) => {
      if (pointer.current !== null && e.pointerId !== pointer.current) return;
      e.preventDefault();
      const next = Math.max(0, Math.min(LEVER_MAX, toSvgUnits(e.clientY) - startY.current));
      current.current = next;
      setOffset(next);
    };

    const release = () => {
      pointer.current = null;
      setDragging(false);
      setOffset(0);
      if (current.current >= LEVER_MAX * LEVER_COMMIT) commit.current();
      current.current = 0;
    };

    // Passive listeners cannot preventDefault, and preventing the move is what
    // keeps iOS from turning the pull into a page pan.
    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', release);
    };
  }, [dragging, toSvgUnits]);

  const onKeyDown = useCallback(
    (e: ReactKeyboardEvent<SVGGElement>) => {
      if (disabled) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onCommit();
      }
    },
    [disabled, onCommit],
  );

  const state: LeverState = !dragging
    ? 'idle'
    : offset >= LEVER_MAX * LEVER_COMMIT
      ? 'ready'
      : 'pulling';

  return {
    offset,
    dragging,
    state,
    handlers: {
      onPointerDown,
      onKeyDown,
    },
  };
}
