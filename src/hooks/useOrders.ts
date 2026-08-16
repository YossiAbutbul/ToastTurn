import { useCallback, useEffect, useMemo, useState } from 'react';
import { syncConfigured } from '../lib/firebase';
import { dropOrder, pushMade, pushOrder, subscribeMade, subscribeOrders } from '../lib/remote';
import { listForFamily, madeFor, orderFor, tally, toggleMade } from '../lib/orders';
import type { MadeBoard, Order, OrderBoard } from '../lib/orders';
import { loadMade, loadOrders, saveMade, saveOrders } from '../lib/storage';
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

  // What has been made is a second board, open to whoever is making it.
  const [ticks, setTicks] = useState<{ id: string; board: MadeBoard }>(() => ({
    id: family.id,
    board: syncConfigured ? {} : (loadMade(family.id) as MadeBoard),
  }));
  if (ticks.id !== family.id) {
    setTicks({ id: family.id, board: syncConfigured ? {} : (loadMade(family.id) as MadeBoard) });
  }

  useEffect(() => {
    if (!syncConfigured) return;
    return subscribeMade(family.id, (raw) => setTicks({ id: family.id, board: raw as MadeBoard }));
  }, [family.id]);

  const made = ticks.board;

  /** Tick one of somebody's slices off, or put it back. */
  const setMade = useCallback(
    (personId: string, index: number) => {
      setTicks((current) => {
        const next = { ...current.board, [personId]: toggleMade(current.board, personId, index) };
        if (!syncConfigured) saveMade(current.id, next);
        else void pushMade(current.id, personId, next[personId]);
        return { id: current.id, board: next };
      });
    },
    [],
  );

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
      setBoard((current) => {
        const next = { ...current };
        delete next[personId];
        if (!syncConfigured) saveOrders(family.id, next);
        return next;
      });

      // The ticks go with it, or a later order would arrive half made.
      setTicks((current) => {
        const next = { ...current.board };
        delete next[personId];
        if (!syncConfigured) saveMade(current.id, next);
        else void pushMade(current.id, personId, []);
        return { id: current.id, board: next };
      });

      if (syncConfigured) void dropOrder(family.id, personId);
    },
    [family.id, setBoard],
  );

  const lines = useMemo(() => listForFamily(board, family), [board, family]);

  return {
    lines,
    tally: useMemo(() => tally(lines, made), [lines, made]),
    mine: orderFor(board, myPersonId),
    /** Which of a person's slices are already made. */
    madeFor: (personId: string) => madeFor(made, personId),
    setMade,
    clear,
    /**
     * Whose order this phone may write. Everyone has their own; the owner
     * also speaks for the people who have no phone of their own.
     */
    canOrderFor: (personId: string) => isOwner || personId === myPersonId,
    set,
  };
}
