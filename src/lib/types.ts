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
  /** Logged without credit — does not move the rotation on. */
  skipped: boolean;
};

export type Schedule = {
  /** 0 = Sunday. */
  weekday: number;
  /** "HH:MM", 24h. */
  time: string;
  remind: boolean;
};

export type Family = {
  /** The code that goes in the share link. */
  id: string;
  /**
   * The device that started the family. It is the only one the server lets
   * change people, the schedule or the rotation — everyone else can log toast.
   * Absent on families made before sync, and on local-only phones.
   */
  ownerUid?: string;
  name: string;
  people: Person[];
  schedule: Schedule;
  /** Newest first, capped at 200 locally. */
  turns: Turn[];
};

export const TURN_CAP = 200;
