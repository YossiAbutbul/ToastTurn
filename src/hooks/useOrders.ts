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
  const [held, setHeld] = useState<{ id: string; board: OrderBoard; fromServer: boolean }>(() => ({
    id: family.id,
    board: syncConfigured ? {} : (loadOrders(family.id) as OrderBoard),
    // With no keys there is no server to hear from, and this phone's own copy
    // is the whole truth.
    fromServer: !syncConfigured,
  }));

  // Switching rotations means a different board. Reading it during the render
  // that noticed, rather than in an effect afterwards, keeps the sheet from
  // showing the last rotation's orders for a frame.
  if (held.id !== family.id) {
    setHeld({
      id: family.id,
      board: syncConfigured ? {} : (loadOrders(family.id) as OrderBoard),
      fromServer: !syncConfigured,
    });
  }

  const board = held.board;
  const setBoard = useCallback(
    (next: (current: OrderBoard) => OrderBoard) =>
      setHeld((current) => ({ ...current, board: next(current.board) })),
    [],
  );

  useEffect(() => {
    if (!syncConfigured) return;
    return subscribeOrders(family.id, (raw, fromServer) =>
      setHeld({ id: family.id, board: raw as OrderBoard, fromServer }),
    );
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
  /**
   * Whether this phone has seen this rotation's board at all yet, and who it
   * was reading it as. The name matters: an order that is missing because
   * nobody has said which person this phone is yet is not an order that has
   * been made.
   */
  const knew = useRef<{ id: string; personId: string | undefined; had: boolean } | null>(null);

  useEffect(() => {
    const before = knew.current;
    const had = Boolean(myPersonId && board[myPersonId]);
    knew.current = { id: family.id, personId: myPersonId, had };

    // Nothing to compare against: the first sight of a rotation's board, or
    // the first after switching to it. An order made an hour ago is not news.
    if (!before || before.id !== family.id) return;
    // Nor is one seen as somebody else, or as nobody. Signing in again after
    // an update forgets who this phone is for a moment, and every phone with
    // an order on the board read that as its toast being made.
    if (!myPersonId || before.personId !== myPersonId) return;
    // Nor is a board this phone has only read off its own cache: an order
    // that has not loaded yet looks exactly like an order that has been made.
    if (!held.fromServer) return;
    if (clearedHere.current) {
      clearedHere.current = false;
      return;
    }
    if (before.had && !had) setReady((n) => n + 1);
  }, [board, held.fromServer, family.id, myPersonId]);

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

  /**
   * The last order taken off, kept until another one is.
   *
   * Saying an order is made deletes what somebody wrote, and a thumb lands on
   * the wrong name easily enough. One step back is worth holding on to; more
   * than one is a history nobody asked for.
   */
  const undone = useRef<Order | null>(null);

  /** Nothing for them today: the order goes, rather than sitting there empty. */
  const clear = useCallback(
    (personId: string) => {
      if (personId === myPersonId) clearedHere.current = true;
      undone.current = orderFor(board, personId);
      setBoard((current) => {
        const next = { ...current };
        delete next[personId];
        if (!syncConfigured) saveOrders(family.id, next);
        return next;
      });

      if (syncConfigured) void dropOrder(family.id, personId);
    },
    [board, family.id, myPersonId, setBoard],
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

  /** Put the last one back, exactly as it was written. */
  const undoClear = useCallback(() => {
    const order = undone.current;
    if (!order) return;
    undone.current = null;
    set(order.personId, order.note ? { slices: order.slices, note: order.note } : { slices: order.slices });
  }, [set]);

  const lines = useMemo(() => listForFamily(board, family), [board, family]);

  return {
    lines,
    tally: useMemo(() => tally(lines), [lines]),
    mine: orderFor(board, myPersonId),
    /** Counts up when someone else makes yours. Zero means nothing yet. */
    ready,
    clear,
    undoClear,
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
