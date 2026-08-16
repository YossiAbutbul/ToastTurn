import { describe, expect, it } from 'vitest';
import { CUSTOM_SATURATION, hexToHsl, hslToHex, isHex } from './color';
import { withMemberColors } from './people';
import type { Family, Person } from './types';

const person = (id: string, color: string): Person => ({
  id,
  name: id.toUpperCase(),
  color,
  order: 0,
  active: true,
});

const family = (people: Person[]): Family => ({
  id: 'fam',
  name: 'The Abutbuls',
  people,
  schedule: { weekday: 0, time: '20:00', remind: true },
  turns: [],
});

describe('colour', () => {
  it('knows a hex when it sees one', () => {
    expect(isHex('#E9553D')).toBe(true);
    expect(isHex('#e9553d')).toBe(true);
    expect(isHex('E9553D')).toBe(false);
    expect(isHex('#E95')).toBe(false);
  });

  it('survives the round trip the rails put it through', () => {
    for (const hue of [0, 45, 120, 210, 300, 359]) {
      const hex = hslToHex({ h: hue, s: CUSTOM_SATURATION, l: 56 });
      const back = hexToHsl(hex);
      expect(back.h).toBeGreaterThanOrEqual(hue - 2);
      expect(back.h).toBeLessThanOrEqual(hue + 2);
      expect(back.l).toBeGreaterThanOrEqual(54);
      expect(back.l).toBeLessThanOrEqual(58);
    }
  });

  it('gives back a colour the browser will accept', () => {
    expect(isHex(hslToHex({ h: 20, s: 62, l: 58 }))).toBe(true);
    expect(hslToHex({ h: 0, s: 0, l: 0 })).toBe('#000000');
    expect(hslToHex({ h: 0, s: 0, l: 100 })).toBe('#FFFFFF');
  });

  it('wraps a hue past the end of the rail rather than clipping it', () => {
    expect(hslToHex({ h: 360, s: 62, l: 56 })).toBe(hslToHex({ h: 0, s: 62, l: 56 }));
  });

  it('falls back rather than throwing on something that is not a colour', () => {
    expect(hexToHsl('rgb(1,2,3)')).toEqual({ h: 20, s: CUSTOM_SATURATION, l: 58 });
  });
});

describe('everyone their own colour', () => {
  it('lays a member choice over the rotation', () => {
    const shown = withMemberColors(family([person('a', '#E9553D')]), { a: '#5FB99E' });
    expect(shown.people[0].color).toBe('#5FB99E');
  });

  it('leaves the rest of the person alone', () => {
    const shown = withMemberColors(family([person('a', '#E9553D')]), { a: '#5FB99E' });
    expect(shown.people[0].name).toBe('A');
    expect(shown.people[0].active).toBe(true);
  });

  it('ignores a choice from someone who is not in the rotation', () => {
    const one = family([person('a', '#E9553D')]);
    expect(withMemberColors(one, { ghost: '#5FB99E' }).people[0].color).toBe('#E9553D');
  });

  // Identity is the point: a fresh object every render would rebuild
  // everything derived from the family.
  it('hands back the same family when nothing is overlaid', () => {
    const one = family([person('a', '#E9553D')]);
    expect(withMemberColors(one, {})).toBe(one);
    expect(withMemberColors(one, { a: '#E9553D' })).toBe(one);
  });
});
