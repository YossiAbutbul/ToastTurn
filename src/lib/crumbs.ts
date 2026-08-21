/**
 * The crumbs that come out with the toast: a handful thrown from the slot,
 * arcing onto the counter, bouncing once and settling there.
 *
 * Pure, and in the toaster's own SVG units, so the physics can be stepped in a
 * test without a browser and the numbers mean the same thing here as they do
 * in the drawing.
 */
export type Crumb = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  /** Every fourth one is a burnt bit rather than a crumb. */
  dark: boolean;
  bounced: boolean;
};

/** The slot, where they come from. */
const SLOT = { x: 168, y: 114 };
/** The counter, at the toaster's feet. */
const FLOOR = 264;
/** Per 16ms frame, which is what a step of 1 means. */
const GRAVITY = 0.5;
/** What is left of the fall after hitting the counter, and of the slide. */
const BOUNCE = -0.34;
const DRAG = 0.84;

/** How long a crumb lasts before it has been swept up. */
export const CRUMB_LIFE_MS = 1500;
/** When it starts to go. */
const FADE_FROM_MS = 950;

/**
 * A fresh handful. Fanned out by index rather than at random: the spread wants
 * to look thrown, not to be different every time, and this way it can be
 * checked.
 */
export function seedCrumbs(count = 12): Crumb[] {
  const middle = (count - 1) / 2;
  return Array.from({ length: count }, (_, i) => {
    const away = i - middle;
    return {
      id: i,
      x: SLOT.x + away * 2.2,
      y: SLOT.y,
      vx: away * 0.62 + Math.sin(i * 2.4) * 0.5,
      vy: -5.4 - (i % 4) * 0.75,
      r: 2.4 + (i % 3) * 0.9,
      dark: i % 4 === 0,
      bounced: false,
    };
  });
}

/** One step of the fall. `frames` is the time since the last one, in 16ms. */
export function stepCrumbs(crumbs: Crumb[], frames: number): Crumb[] {
  return crumbs.map((crumb) => {
    const next = {
      ...crumb,
      vy: crumb.vy + GRAVITY * frames,
      x: crumb.x + crumb.vx * frames,
      y: crumb.y + crumb.vy * frames,
    };

    if (next.y < FLOOR) return next;

    // On the counter: one bounce, then it slides to a stop and stays put.
    next.y = FLOOR;
    if (!next.bounced) {
      next.bounced = true;
      next.vy *= BOUNCE;
      next.vx *= 0.7;
    } else {
      next.vy = 0;
      // Raised to the step, not multiplied by it: a phone drawing at 120Hz
      // takes twice as many steps and would otherwise stop them twice as fast.
      next.vx *= DRAG ** frames;
    }
    return next;
  });
}

/** How much of a crumb is left to see, by how long it has been out. */
export function crumbFade(ageMs: number): number {
  if (ageMs <= FADE_FROM_MS) return 1;
  return Math.max(0, 1 - (ageMs - FADE_FROM_MS) / (CRUMB_LIFE_MS - FADE_FROM_MS));
}
