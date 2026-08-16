const shortDate = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' });

/** "2026-08-09" → "Aug 9" */
export function formatShortDate(iso: string | undefined): string {
  if (!iso) return '';
  const d = new Date(iso.length <= 10 ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return shortDate.format(d);
}

/**
 * A day the family picked, as a timestamp in the middle of it. Midnight would
 * land on the day before in any timezone behind UTC, and the middle of the day
 * survives being read back anywhere.
 */
export function isoForDay(date: Date): string {
  const noon = new Date(date);
  noon.setHours(12, 0, 0, 0);
  return noon.toISOString();
}

const dayDate = new Intl.DateTimeFormat('en', { weekday: 'long', month: 'short', day: 'numeric' });

/** A date the toast is due → "Sunday, Aug 23" */
export function formatDayDate(date: Date): string {
  return dayDate.format(date);
}

/** "20:00" → "8:00 PM" */
export function prettyTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return time;
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
}

/** First letter, for the slice and the queue toasts. */
export function initialOf(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?';
}
