import { nanoid } from 'nanoid';

/** Ids for people and turns. */
export function newId(): string {
  return nanoid(10);
}

/** The family code that goes in the share link, short enough to read aloud. */
export function newFamilyCode(): string {
  return nanoid(8);
}
