export type Person = {
  id: string;
  name: string;
  color: string;
  /** Position in the rotation. */
  order: number;
  /** false = on holiday, skipped automatically. */
  active: boolean;
};

export type Turn = {
  id: string;
  personId: string;
  /**
   * ISO timestamp. It carries the time, not just the day, so two turns logged
   * on the same date still order correctly on every phone.
   */
  madeAt: string;
  /**
   * What each account thought of it, 1-5, keyed by account id. Everyone gets a
   * say; the row shows the average.
   */
  ratings?: Record<string, number>;
  /** A single rating from before ratings were per person. Counts as one vote. */
  rating?: number;
  /** Logged without credit, does not move the rotation on. */
  skipped: boolean;
};

export type Family = {
  /** The code that goes in the share link. */
  id: string;
  /**
   * The device that started the family. It is the only one the server lets
   * change the people or the rotation, everyone else can log toast.
   * Absent on families made before sync, and on local-only phones.
   */
  ownerUid?: string;
  /** Which person in the rotation the owner is. */
  ownerPersonId?: string;
  name: string;
  people: Person[];
  /** Newest first, capped at 200 locally. */
  turns: Turn[];
  /**
   * Turns the owner took off the board.
   *
   * Deleting a turn is not enough on its own: the logs of two phones are
   * merged by union, so a turn removed here comes straight back from the other
   * side, and then gets republished. The id is remembered instead, and every
   * phone drops it.
   */
  removed?: string[];
};

export const TURN_CAP = 200;
/** How many removals to remember. Long past what any family will undo. */
export const REMOVED_CAP = 100;
