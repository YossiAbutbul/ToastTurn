/** The family code lives in the path: /f/{id}. Opening that link joins. */
const PATTERN = /^\/f\/([A-Za-z0-9_-]{4,32})\/?$/;

export function familyIdFromPath(pathname: string): string | null {
  return PATTERN.exec(pathname)?.[1] ?? null;
}

export function pathForFamily(id: string): string {
  return `/f/${id}`;
}

export function linkForFamily(origin: string, id: string): string {
  return `${origin}${pathForFamily(id)}`;
}

/** Codes are 8 characters. Anything shorter is a typo, not a rotation. */
const CODE = /^[A-Za-z0-9_-]{8,32}$/;

/**
 * What someone pastes into "join": a whole link, or just the code from it.
 * Returns null when it is neither.
 */
export function familyIdFromInput(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const inLink = /\/f\/([A-Za-z0-9_-]{4,32})/.exec(trimmed);
  if (inLink) return inLink[1];

  return CODE.test(trimmed) ? trimmed : null;
}
