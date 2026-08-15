import type { Family, Person } from './types';

/** Addresses are compared case-insensitively and trimmed, like every mail app. */
export function sameEmail(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/** Which person in the rotation this account is, if any. */
export function personForEmail(family: Family, email: string | null | undefined): Person | null {
  if (!email) return null;
  return family.people.find((p) => sameEmail(p.email, email)) ?? null;
}

/** The key a person's own choices are stored under. */
export function emailKey(email: string): string {
  return email.trim().toLowerCase();
}
