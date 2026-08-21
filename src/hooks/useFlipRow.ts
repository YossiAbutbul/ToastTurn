import { useLayoutEffect, useRef } from 'react';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';
import type { RefObject } from 'react';

/**
 * Slide a row of things to their new places instead of letting them jump.
 *
 * FLIP: every child that carries a `data-flip` key is measured after each
 * render, put back where it was with a transform, and then let go on the next
 * frame so the browser animates it home. Nothing is measured before the render
 * because React has already done it by the time this runs, and nothing is
 * stored but the last set of positions.
 *
 * The measurement is `offsetLeft`, which is where a thing sits in the layout,
 * not `getBoundingClientRect()`, which is where it is on the glass. Anything
 * else re-renders during the slide - the crumbs alone re-render every frame -
 * and every one of those would measure a chip mid-flight, take that for its
 * home, and start it over from there. It also means scrolling the queue
 * sideways is not mistaken for people moving.
 */
export function useFlipRow(ref: RefObject<HTMLElement | null>): void {
  const reduced = usePrefersReducedMotion();
  const was = useRef(new Map<string, number>());

  useLayoutEffect(() => {
    const row = ref.current;
    if (!row) return;

    const kids = Array.from(row.querySelectorAll<HTMLElement>('[data-flip]'));
    const now = new Map<string, number>();
    const moved: Array<{ el: HTMLElement; by: number }> = [];

    for (const kid of kids) {
      const key = kid.dataset.flip ?? '';
      const left = kid.offsetLeft;
      now.set(key, left);

      const before = was.current.get(key);
      // A child that wasn't there last time has nowhere to have come from.
      if (before === undefined || Math.abs(before - left) < 0.5) continue;
      moved.push({ el: kid, by: before - left });
    }
    was.current = now;

    if (reduced || moved.length === 0) return;

    for (const { el, by } of moved) {
      el.style.transition = 'none';
      el.style.transform = `translateX(${by}px)`;
    }

    // Made to happen, not asked for politely. This effect and a
    // requestAnimationFrame after it both run before the browser paints, so
    // putting things back and letting go in those two places is one frame as
    // far as it is concerned: it sees the finished row, has nothing to move
    // from, and draws it there. Reading the layout forces the browser to work
    // out the inverted row first, and letting go after that is a change it
    // has to animate.
    void row.offsetHeight;

    for (const { el } of moved) {
      el.style.transition = '';
      el.style.transform = '';
    }
  });
}
