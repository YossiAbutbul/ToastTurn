/**
 * Asking someone to take your turn.
 *
 * A swap moves the rotation, and only the owner's account may write that, so
 * an ask is a note left in a place everyone can read: the person it is
 * addressed to answers it, and the owner's phone is what finally moves the
 * two people past each other.
 */

export type SwapStatus = 'pending' | 'accepted' | 'declined' | 'done';

export type SwapRequest = {
  id: string;
  /** Who is asking, and who is being asked, as people in the rotation. */
  fromPersonId: string;
  toPersonId: string;
  /** The toast night in question, ISO, so the ask names a date. */
  date: string;
  askedAt: string;
  status: SwapStatus;
};

export type SwapBoard = Record<string, SwapRequest>;

const byOldest = (a: SwapRequest, b: SwapRequest) => a.askedAt.localeCompare(b.askedAt);

/** Everything on the board, oldest first, with anything malformed dropped. */
export function allSwaps(board: SwapBoard): SwapRequest[] {
  return Object.values(board ?? {})
    .filter(
      (swap): swap is SwapRequest =>
        Boolean(swap) &&
        typeof swap.id === 'string' &&
        typeof swap.fromPersonId === 'string' &&
        typeof swap.toPersonId === 'string' &&
        typeof swap.askedAt === 'string',
    )
    .sort(byOldest);
}

/** The ask waiting on you, if there is one. Oldest first: nobody is skipped. */
export function pendingFor(board: SwapBoard, personId: string | undefined): SwapRequest | null {
  if (!personId) return null;
  return (
    allSwaps(board).find((swap) => swap.status === 'pending' && swap.toPersonId === personId) ?? null
  );
}

/** An ask of yours that has been answered, so the answer can be passed on. */
export function answeredFrom(board: SwapBoard, personId: string | undefined): SwapRequest | null {
  if (!personId) return null;
  return (
    allSwaps(board).find(
      (swap) =>
        swap.fromPersonId === personId &&
        (swap.status === 'declined' || swap.status === 'accepted'),
    ) ?? null
  );
}

/**
 * Accepted asks the rotation has not caught up with yet. Only the owner's
 * phone acts on these, because only it is allowed to write the people.
 */
export function acceptedToApply(board: SwapBoard): SwapRequest[] {
  return allSwaps(board).filter((swap) => swap.status === 'accepted');
}

/** True when these two are still the two the ask was about. */
export function stillMakesSense(swap: SwapRequest, peopleIds: string[]): boolean {
  return peopleIds.includes(swap.fromPersonId) && peopleIds.includes(swap.toPersonId);
}

export function withStatus(swap: SwapRequest, status: SwapStatus): SwapRequest {
  return { ...swap, status };
}
