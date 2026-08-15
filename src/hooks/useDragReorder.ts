import { useCallback, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';

type Options = {
  count: number;
  /** Row height plus the gap between rows, in px. */
  itemHeight: number;
  onMove: (from: number, to: number) => void;
};

/** Pointer-drag reordering for a fixed-height list. Works with touch and mouse. */
export function useDragReorder({ count, itemHeight, onMove }: Options) {
  const [index, setIndex] = useState<number | null>(null);
  const [dy, setDy] = useState(0);
  const startY = useRef(0);

  const target = index === null ? null : clamp(index + Math.round(dy / itemHeight), 0, count - 1);

  const finish = useCallback(() => {
    if (index !== null && target !== null && target !== index) onMove(index, target);
    setIndex(null);
    setDy(0);
  }, [index, onMove, target]);

  const handlers = useCallback(
    (i: number) => ({
      onPointerDown: (e: ReactPointerEvent<HTMLElement>) => {
        startY.current = e.clientY;
        setIndex(i);
        setDy(0);
        e.currentTarget.setPointerCapture(e.pointerId);
      },
      onPointerMove: (e: ReactPointerEvent<HTMLElement>) => {
        if (index === null) return;
        e.preventDefault();
        setDy(e.clientY - startY.current);
      },
      onPointerUp: finish,
      onPointerCancel: finish,
    }),
    [finish, index],
  );

  /** How far row `i` should sit from its resting place while a drag is live. */
  const offsetFor = useCallback(
    (i: number) => {
      if (index === null || target === null) return 0;
      if (i === index) return dy;
      if (index < target && i > index && i <= target) return -itemHeight;
      if (target < index && i >= target && i < index) return itemHeight;
      return 0;
    },
    [dy, index, itemHeight, target],
  );

  return { dragging: index, offsetFor, handlers };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
