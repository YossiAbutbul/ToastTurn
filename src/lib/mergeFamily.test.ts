import { describe, expect, it } from 'vitest';
import { mergeFamily, metaChanged, unsentTurns } from './mergeFamily';
import { familyIdFromPath, linkForFamily } from './url';
import type { Family, Person, Turn } from './types';

const person = (id: string, order: number): Person => ({
  id,
  name: id.toUpperCase(),
  color: '#E9553D',
  order,
  active: true,
});

const turn = (id: string, personId: string, madeAt: string): Turn => ({
  id,
  personId,
  madeAt,
  skipped: false,
});

const family = (over: Partial<Family> = {}): Family => ({
  id: 'fam',
  name: 'Test',
  people: [person('a', 0), person('b', 1)],
  schedule: { weekday: 0, time: '20:00', remind: true },
  turns: [],
  ...over,
});

describe('mergeFamily', () => {
  it('takes the whole remote family when this phone has none', () => {
    const remote = family({ turns: [turn('t1', 'a', '2026-08-09')] });
    expect(mergeFamily(null, remote)).toEqual(remote);
  });

  it('replaces a different family outright — that is what joining a link means', () => {
    const local = family({ id: 'old' });
    const remote = family({ id: 'new', name: 'Other' });
    expect(mergeFamily(local, remote).id).toBe('new');
  });

  it('keeps a turn logged offline here and adds the one from the other phone', () => {
    const local = family({ turns: [turn('mine', 'a', '2026-08-16')] });
    const remote = family({ turns: [turn('theirs', 'b', '2026-08-09')] });

    const merged = mergeFamily(local, remote);
    expect(merged.turns.map((t) => t.id)).toEqual(['mine', 'theirs']);
  });

  it('does not duplicate a turn that has come back from the server', () => {
    const shared = turn('t1', 'a', '2026-08-09');
    const merged = mergeFamily(family({ turns: [shared] }), family({ turns: [shared] }));
    expect(merged.turns).toHaveLength(1);
  });

  it('lets the server settle name, people and schedule', () => {
    const local = family({ name: 'Mine', schedule: { weekday: 3, time: '07:00', remind: false } });
    const remote = family({ name: 'Theirs', people: [person('c', 0)] });

    const merged = mergeFamily(local, remote);
    expect(merged.name).toBe('Theirs');
    expect(merged.people.map((p) => p.id)).toEqual(['c']);
    expect(merged.schedule).toEqual(remote.schedule);
  });

  it('sorts newest first and caps the local log at 200', () => {
    const many = Array.from({ length: 260 }, (_, i) =>
      turn(`t${i}`, 'a', `2026-01-${String((i % 28) + 1).padStart(2, '0')}`),
    );
    const merged = mergeFamily(family(), family({ turns: many }));
    expect(merged.turns).toHaveLength(200);
    expect(merged.turns[0].madeAt >= merged.turns[199].madeAt).toBe(true);
  });
});

describe('unsentTurns', () => {
  it('is what this phone still owes the others', () => {
    const local = family({ turns: [turn('a1', 'a', '2026-08-16'), turn('b1', 'b', '2026-08-09')] });
    expect(unsentTurns(local, new Set(['b1'])).map((t) => t.id)).toEqual(['a1']);
  });
});

describe('metaChanged', () => {
  it('is true when there is nothing published yet', () => {
    expect(metaChanged(family(), null)).toBe(true);
  });

  it('is false when the two agree', () => {
    expect(metaChanged(family(), family())).toBe(false);
  });

  it('notices a renamed family, a new person and a moved toast night', () => {
    expect(metaChanged(family({ name: 'New' }), family())).toBe(true);
    expect(metaChanged(family({ people: [person('a', 0)] }), family())).toBe(true);
    expect(metaChanged(family({ schedule: { weekday: 5, time: '20:00', remind: true } }), family())).toBe(true);
  });

  it('ignores turns — those go up on their own', () => {
    expect(metaChanged(family({ turns: [turn('t1', 'a', '2026-08-09')] }), family())).toBe(false);
  });
});

describe('the family link', () => {
  it('reads the code out of the path', () => {
    expect(familyIdFromPath('/f/abc12345')).toBe('abc12345');
    expect(familyIdFromPath('/f/abc12345/')).toBe('abc12345');
  });

  it('ignores anything that is not a family link', () => {
    expect(familyIdFromPath('/')).toBeNull();
    expect(familyIdFromPath('/f/')).toBeNull();
    expect(familyIdFromPath('/f/no spaces')).toBeNull();
    expect(familyIdFromPath('/family/abc12345')).toBeNull();
  });

  it('builds a link worth sending', () => {
    expect(linkForFamily('https://toastturn.app', 'abc12345')).toBe('https://toastturn.app/f/abc12345');
  });
});
