/** The only place the app reads the wall clock, so tests can fake it. */

let source: () => Date = () => new Date();

export function now(): Date {
  return source();
}

export function nowISO(): string {
  return source().toISOString();
}

/** Just the date part, in local time. Used for day-level comparisons. */
export function todayISO(): string {
  const d = source();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Test seam. */
export function setClock(fn: () => Date) {
  source = fn;
}
