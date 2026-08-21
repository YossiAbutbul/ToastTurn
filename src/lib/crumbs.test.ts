import { describe, expect, it } from 'vitest';
import { CRUMB_LIFE_MS, crumbFade, seedCrumbs, stepCrumbs } from './crumbs';

const settle = (frames = 200) => {
  let crumbs = seedCrumbs();
  for (let i = 0; i < frames; i += 1) crumbs = stepCrumbs(crumbs, 1);
  return crumbs;
};

describe('crumbs', () => {
  it('throws the same handful every time, fanned out from the slot', () => {
    const first = seedCrumbs();
    expect(first).toHaveLength(12);
    expect(first.map((c) => c.id)).toEqual(seedCrumbs().map((c) => c.id));
    expect(first.every((c) => c.vy < 0)).toBe(true);
    expect(first[0].vx).toBeLessThan(first[11].vx);
  });

  it('goes up before it comes down', () => {
    const crumbs = seedCrumbs();
    const up = stepCrumbs(crumbs, 1);
    expect(up[0].y).toBeLessThan(crumbs[0].y);
  });

  it('lands on the counter and stays there', () => {
    const rested = settle();
    expect(rested.every((c) => c.y === 264)).toBe(true);
    expect(rested.every((c) => c.bounced)).toBe(true);
    expect(rested.every((c) => Math.abs(c.vx) < 0.1)).toBe(true);
  });

  it('bounces once, not forever', () => {
    let crumbs = seedCrumbs();
    let bounces = 0;
    for (let i = 0; i < 200; i += 1) {
      const next = stepCrumbs(crumbs, 1);
      if (!crumbs[0].bounced && next[0].bounced) bounces += 1;
      crumbs = next;
    }
    expect(bounces).toBe(1);
  });

  // Not to the unit: stepping a fall in bigger jumps is always a little
  // different. Within a couple of units of a 340-wide drawing is close enough
  // that no two phones look like they threw different crumbs.
  it('lands in about the same place whatever the frame rate', () => {
    let slow = seedCrumbs();
    for (let i = 0; i < 100; i += 1) slow = stepCrumbs(slow, 2);
    let fast = seedCrumbs();
    for (let i = 0; i < 200; i += 1) fast = stepCrumbs(fast, 1);
    expect(Math.abs(slow[3].x - fast[3].x)).toBeLessThan(4);
  });

  it('is whole until it starts to go, and gone by the end', () => {
    expect(crumbFade(0)).toBe(1);
    expect(crumbFade(900)).toBe(1);
    expect(crumbFade(CRUMB_LIFE_MS)).toBe(0);
    expect(crumbFade(1200)).toBeGreaterThan(0);
    expect(crumbFade(1200)).toBeLessThan(1);
  });
});
