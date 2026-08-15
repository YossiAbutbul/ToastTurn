import { useCallback, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';

/** Past this much of a drag, letting go closes the sheet. */
const CLOSE_AT = 96;

/**
 * Drag a sheet down to close it, the way every other sheet on a phone works.
 * The grip at the top is the handle: dragging from the body would fight with
 * scrolling a long history.
 */
export function useSheetDrag(onClose: () => void) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startY = useRef(0);
  const current = useRef(0);

  const onPointerDown = useCallback((e: ReactPointerEvent<HTMLElement>) => {
    startY.current = e.clientY;
    current.current = 0;
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (!dragging) return;
      // Down only: dragging up should not lift the sheet off the bottom.
      const next = Math.max(0, e.clientY - startY.current);
      current.current = next;
      setOffset(next);
    },
    [dragging],
  );

  const release = useCallback(() => {
    if (!dragging) return;
    setDragging(false);
    setOffset(0);
    if (current.current >= CLOSE_AT) onClose();
    current.current = 0;
  }, [dragging, onClose]);

  return {
    offset,
    dragging,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: release,
      onPointerCancel: release,
    },
  };
}
