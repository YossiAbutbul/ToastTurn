import { useCallback, useEffect, useState } from 'react';
import { syncConfigured } from '../lib/firebase';
import { pushSwap, subscribeSwaps } from '../lib/remote';
import { acceptedToApply, answeredFrom, pendingFor, stillMakesSense, withStatus } from '../lib/swaps';
import type { SwapBoard, SwapRequest, SwapStatus } from '../lib/swaps';
import { newId } from '../lib/id';
import { nowISO } from '../lib/clock';
import type { Family, Person } from '../lib/types';

type Options = {
  family: Family;
  /** Which person in the rotation this phone is, if it is anybody. */
  me: Person | null;
  isOwner: boolean;
  /** Move the two people past each other. Only ever called on the owner's phone. */
  onApply: (fromPersonId: string, toPersonId: string) => void;
};

/**
 * The swap board.
 *
 * An ask is written where everyone can read it and answered by the person it
 * names. Applying it is the owner's alone, so a member's yes waits on the
 * board until the owner's phone next has the app open, and is applied then.
 */
export function useSwaps({ family, me, isOwner, onApply }: Options) {
  const [board, setBoard] = useState<SwapBoard>({});

  useEffect(() => {
    if (!syncConfigured) return;
    return subscribeSwaps(family.id, (raw) => setBoard(raw as SwapBoard));
  }, [family.id]);

  const write = useCallback(
    (swap: SwapRequest) => {
      setBoard((current) => ({ ...current, [swap.id]: swap }));
      void pushSwap(family.id, swap);
    },
    [family.id],
  );

  /** Ask someone to take the turn. */
  const ask = useCallback(
    (toPersonId: string, date: string) => {
      if (!me) return;
      write({
        id: newId(),
        fromPersonId: me.id,
        toPersonId,
        date,
        askedAt: nowISO(),
        status: 'pending',
      });
    },
    [me, write],
  );

  const answer = useCallback(
    (swap: SwapRequest, status: SwapStatus) => write(withStatus(swap, status)),
    [write],
  );

  const peopleIds = family.people.map((person) => person.id);

  // The owner's phone is the only one that can move the rotation, so it is the
  // one that clears accepted asks off the board. The work waits until the
  // render has settled: it is a reaction to something that arrived from
  // another phone, not state being kept in step with a prop.
  const ids = peopleIds.join(',');
  useEffect(() => {
    if (!isOwner) return;
    const waiting = acceptedToApply(board);
    if (waiting.length === 0) return;

    const timer = window.setTimeout(() => {
      for (const swap of waiting) {
        if (stillMakesSense(swap, ids.split(','))) onApply(swap.fromPersonId, swap.toPersonId);
        // Straight up, rather than through the local copy: the snapshot brings
        // it back, and one writer beats two.
        void pushSwap(family.id, withStatus(swap, 'done'));
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [board, family.id, ids, isOwner, onApply]);

  const incoming = pendingFor(board, me?.id);
  const answered = answeredFrom(board, me?.id);

  return {
    /** The ask waiting on you, if there is one. */
    incoming: incoming && stillMakesSense(incoming, peopleIds) ? incoming : null,
    /** An answer to an ask of yours, to be shown once and then cleared. */
    answered: answered && answered.status === 'declined' ? answered : null,
    ask,
    accept: (swap: SwapRequest) => answer(swap, 'accepted'),
    decline: (swap: SwapRequest) => answer(swap, 'declined'),
    /** Whoever asked has now been told, so the answer comes off the board. */
    close: (swap: SwapRequest) => answer(swap, 'done'),
  };
}
