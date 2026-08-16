import { useCallback, useRef, useState } from 'react';
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

export function useLeverDrag({ svgRef, disabled, onCommit }: Options) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startY = useRef(0);
  const current = useRef(0);

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
      startY.current = toSvgUnits(e.clientY);
      current.current = 0;
      setDragging(true);
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Capture is a nicety: the drag still tracks without it.
      }
    },
    [disabled, toSvgUnits],
  );

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<SVGGElement>) => {
      if (!dragging) return;
      const next = Math.max(0, Math.min(LEVER_MAX, toSvgUnits(e.clientY) - startY.current));
      current.current = next;
      setOffset(next);
    },
    [dragging, toSvgUnits],
  );

  const release = useCallback(() => {
    if (!dragging) return;
    setDragging(false);
    setOffset(0);
    if (current.current >= LEVER_MAX * LEVER_COMMIT) onCommit();
    current.current = 0;
  }, [dragging, onCommit]);

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
      onPointerMove,
      onPointerUp: release,
      onPointerCancel: release,
      onKeyDown,
    },
  };
}
