import { useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, KeyboardEvent as ReactKeyboardEvent } from 'react';

type GripProps = {
  onPointerDown: (e: ReactPointerEvent) => void;
  onPointerMove: (e: ReactPointerEvent) => void;
  onPointerUp: (e: ReactPointerEvent) => void;
  onPointerCancel: (e: ReactPointerEvent) => void;
  onKeyDown: (e: ReactKeyboardEvent) => void;
};

export type DragList = {
  /** The ids to paint, in the order they sit in right now. */
  order: string[];
  /** Which row is under the finger, if any. */
  dragging: string | null;
  /** How far that row has been carried from its slot, in pixels. */
  offset: number;
  /** Everything a row's handle needs. Nothing else in the row listens. */
  grip: (id: string) => GripProps;
};

/**
 * Drag a list of rows into a new order, by their handles.
 *
 * Only the handle takes the pointer, and it takes it whole (`touch-action`
 * off, pointer captured), so the sheet around it still scrolls with a thumb
 * on the rows themselves. That is the fight the arrows used to avoid.
 *
 * The rows keep their slots: the one being carried is moved through the list
 * as the finger passes the midpoint of its neighbours, and drawn offset from
 * wherever it now sits. Nothing is measured after the drag begins, so a row
 * sliding into place under the finger doesn't move the ground it's measured
 * against.
 *
 * The handle is a button as well as a handle: up and down arrow keys move the
 * row a place at a time, so this works without a pointer at all.
 */
export function useDragList(ids: string[], onChange: (ids: string[]) => void): DragList {
  const [order, setOrder] = useState(ids);
  const [dragging, setDragging] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);

  // Slot centres and the sequence they belong to, both as they were when the
  // finger went down.
  const slots = useRef<number[]>([]);
  const from = useRef(0);
  const startY = useRef(0);
  const startOrder = useRef(ids);

  // Somebody added a name, or another phone did: take the new list, unless a
  // row is in the air, in which case it lands first.
  const [shown, setShown] = useState(ids.join());
  if (!dragging && shown !== ids.join()) {
    setShown(ids.join());
    setOrder(ids);
  }

  const commit = (next: string[]) => {
    setShown(next.join());
    setOrder(next);
    onChange(next);
  };

  const moved = (list: string[], at: number, to: number) => {
    const next = [...list];
    const [row] = next.splice(at, 1);
    next.splice(to, 0, row);
    return next;
  };

  const start = (e: ReactPointerEvent, id: string) => {
    const handle = e.currentTarget as HTMLElement;
    const list = handle.closest('[data-drag-list]');
    if (!list) return;

    const rows = new Map(
      Array.from(list.querySelectorAll<HTMLElement>('[data-drag-row]')).map((row) => [
        row.dataset.dragRow ?? '',
        row.getBoundingClientRect(),
      ]),
    );
    slots.current = order.map((rowId) => {
      const box = rows.get(rowId);
      return box ? box.top + box.height / 2 : 0;
    });

    from.current = order.indexOf(id);
    startY.current = e.clientY;
    startOrder.current = order;
    handle.setPointerCapture(e.pointerId);
    setDragging(id);
    setOffset(0);
  };

  const through = (e: ReactPointerEvent) => {
    if (!dragging) return;
    const centres = slots.current;
    const at = from.current;
    const carried = centres[at] + (e.clientY - startY.current);

    let to = at;
    while (to > 0 && carried < centres[to - 1]) to -= 1;
    while (to < centres.length - 1 && carried > centres[to + 1]) to += 1;

    setOrder(moved(startOrder.current, at, to));
    setOffset(carried - centres[to]);
  };

  const end = (e: ReactPointerEvent) => {
    if (!dragging) return;
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    setDragging(null);
    setOffset(0);
    if (order.join() !== startOrder.current.join()) commit(order);
  };

  const byKey = (e: ReactKeyboardEvent, id: string) => {
    const delta = e.key === 'ArrowUp' ? -1 : e.key === 'ArrowDown' ? 1 : 0;
    if (delta === 0) return;

    const at = order.indexOf(id);
    const to = at + delta;
    if (at === -1 || to < 0 || to >= order.length) return;

    e.preventDefault();
    commit(moved(order, at, to));
  };

  return {
    order,
    dragging,
    offset,
    grip: (id) => ({
      onPointerDown: (e) => start(e, id),
      onPointerMove: through,
      onPointerUp: end,
      onPointerCancel: end,
      onKeyDown: (e) => byKey(e, id),
    }),
  };
}
