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
  /** ISO date. */
  madeAt: string;
  /** 1-5, added later by anyone. */
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
  name: string;
  people: Person[];
  schedule: Schedule;
  /** Newest first, capped at 200 locally. */
  turns: Turn[];
};

export const TURN_CAP = 200;
