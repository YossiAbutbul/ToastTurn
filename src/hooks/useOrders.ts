import { useCallback, useEffect, useMemo, useState } from 'react';
import { syncConfigured } from '../lib/firebase';
import { pushOrder, subscribeOrders } from '../lib/remote';
import { listForFamily, orderFor, tally } from '../lib/orders';
import type { Order, OrderBoard } from '../lib/orders';
import { loadOrders, saveOrders } from '../lib/storage';
import { nowISO } from '../lib/clock';
import type { Family } from '../lib/types';

/**
 * The order board.
 *
 * With sync on it lives beside the family, so the person making the toast
 * reads it off their own phone. With no keys there is only this phone, and it
 * keeps the board in local storage, which is enough for a family that shares
 * one tablet on the counter.
 */
export function useOrders(family: Family, myPersonId: string | undefined, isOwner: boolean) {
  const [held, setHeld] = useState<{ id: string; board: OrderBoard }>(() => ({
    id: family.id,
    board: syncConfigured ? {} : (loadOrders(family.id) as OrderBoard),
  }));

  // Switching rotations means a different board. Reading it during the render
  // that noticed, rather than in an effect afterwards, keeps the sheet from
  // showing the last rotation's orders for a frame.
  if (held.id !== family.id) {
    setHeld({ id: family.id, board: syncConfigured ? {} : (loadOrders(family.id) as OrderBoard) });
  }

  const board = held.board;
  const setBoard = useCallback(
    (next: (current: OrderBoard) => OrderBoard) =>
      setHeld((current) => ({ id: current.id, board: next(current.board) })),
    [],
  );

  useEffect(() => {
    if (!syncConfigured) return;
    return subscribeOrders(family.id, (raw) => setHeld({ id: family.id, board: raw as OrderBoard }));
  }, [family.id]);

  const set = useCallback(
    (personId: string, choice: Omit<Order, 'personId' | 'updatedAt'>) => {
      const order: Order = { ...choice, personId, updatedAt: nowISO() };

      setBoard((current) => {
        const next = { ...current, [personId]: order };
        if (!syncConfigured) saveOrders(family.id, next);
        return next;
      });

      if (syncConfigured) void pushOrder(family.id, personId, order);
    },
    [family.id, setBoard],
  );

  const lines = useMemo(() => listForFamily(board, family), [board, family]);

  return {
    lines,
    tally: useMemo(() => tally(lines), [lines]),
    mine: orderFor(board, myPersonId),
    /**
     * Whose order this phone may write. Everyone has their own; the owner
     * also speaks for the people who have no phone of their own.
     */
    canOrderFor: (personId: string) => isOwner || personId === myPersonId,
    set,
  };
}
