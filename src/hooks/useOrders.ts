import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { syncConfigured } from '../lib/firebase';
import { dropOrder, pushOrder, subscribeOrders } from '../lib/remote';
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
export function useOrders(family: Family, myPersonId: string | undefined) {
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

  /**
   * Somebody has just made yours.
   *
   * Nothing is sent: an order comes off the board the moment it is made, so
   * a phone watching its own line sees it go and knows the toast is out. The
   * one exception is the phone that took it off, which knew already.
   */
  const [ready, setReady] = useState(0);
  /** Taken off here, so its going is not news. */
  const clearedHere = useRef(false);
  /** Whether this phone has seen this rotation's board at all yet. */
  const knew = useRef<{ id: string; had: boolean } | null>(null);

  useEffect(() => {
    const before = knew.current;
    const had = Boolean(myPersonId && board[myPersonId]);
    knew.current = { id: family.id, had };

    // Nothing to compare against: the first sight of a rotation's board, or
    // the first after switching to it. An order made an hour ago is not news.
    if (!before || before.id !== family.id) return;
    if (clearedHere.current) {
      clearedHere.current = false;
      return;
    }
    if (before.had && !had) setReady((n) => n + 1);
  }, [board, family.id, myPersonId]);

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

  /** Nothing for them today: the order goes, rather than sitting there empty. */
  const clear = useCallback(
    (personId: string) => {
      if (personId === myPersonId) clearedHere.current = true;
      setBoard((current) => {
        const next = { ...current };
        delete next[personId];
        if (!syncConfigured) saveOrders(family.id, next);
        return next;
      });

      if (syncConfigured) void dropOrder(family.id, personId);
    },
    [family.id, myPersonId, setBoard],
  );

  /**
   * Breakfast is over: the whole board comes off at once.
   *
   * Orders come off one at a time as they are made, so this is for the ones
   * nobody got round to - a list left standing is a list that says next week
   * what was wanted last week.
   */
  const clearBoard = useCallback(() => {
    for (const personId of Object.keys(board)) clear(personId);
  }, [board, clear]);

  const lines = useMemo(() => listForFamily(board, family), [board, family]);

  return {
    lines,
    tally: useMemo(() => tally(lines), [lines]),
    mine: orderFor(board, myPersonId),
    /** Counts up when someone else makes yours. Zero means nothing yet. */
    ready,
    clear,
    clearBoard,
    /**
     * Whose order this phone may write: your own, and nobody else's. Running
     * the rotation does not extend to deciding what anyone else eats. Saying
     * an order is made is a separate matter, because whoever is making the
     * toast has to say it about everybody's.
     */
    canOrderFor: (personId: string) => Boolean(myPersonId) && personId === myPersonId,
    set,
  };
}
