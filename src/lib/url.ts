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
