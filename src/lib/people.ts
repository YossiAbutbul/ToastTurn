import type { Family } from './types';

/**
 * Lay each person's own choice of colour over the rotation.
 *
 * Only the owner's account may write the people, so anyone else keeps their
 * colour in their membership entry, which they are allowed to write and
 * everyone with the link can read. Folding the two together here means the
 * rest of the app never has to know which of the two it is looking at.
 */
export function withMemberColors(family: Family, colors: Record<string, string>): Family {
  const ids = Object.keys(colors);
  if (ids.length === 0) return family;

  let changed = false;
  const people = family.people.map((person) => {
    const chosen = colors[person.id];
    if (!chosen || chosen === person.color) return person;
    changed = true;
    return { ...person, color: chosen };
  });

  return changed ? { ...family, people } : family;
}
