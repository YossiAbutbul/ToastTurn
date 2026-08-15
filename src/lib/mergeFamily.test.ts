import { describe, expect, it } from 'vitest';
import { mergeFamily, metaChanged, unsentRatings, unsentTurns } from './mergeFamily';
import { verdict } from './ratings';
import { familyIdFromInput, familyIdFromPath, linkForFamily } from './url';
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
    const remote = family({ turns: [turn('b1', 'b', '2026-08-09')] });
    expect(unsentTurns(local, remote).map((t) => t.id)).toEqual(['a1']);
  });

});

describe('unsentRatings', () => {
  it('is the rating this account gave that is not up yet', () => {
    const local = family({ turns: [{ ...turn('t1', 'a', '2026-08-09'), ratings: { me: 5 } }] });
    const remote = family({ turns: [turn('t1', 'a', '2026-08-09')] });
    expect(unsentRatings(local, remote, 'me')).toEqual([{ turnId: 't1', rating: 5 }]);
  });

  it('ignores what other people gave', () => {
    const local = family({ turns: [{ ...turn('t1', 'a', '2026-08-09'), ratings: { you: 2 } }] });
    const remote = family({ turns: [turn('t1', 'a', '2026-08-09')] });
    expect(unsentRatings(local, remote, 'me')).toEqual([]);
  });

  it('says nothing when the rating is already published', () => {
    const rated = { ...turn('t1', 'a', '2026-08-09'), ratings: { me: 4 } };
    expect(unsentRatings(family({ turns: [rated] }), family({ turns: [rated] }), 'me')).toEqual([]);
  });
});

describe('rating a turn', () => {
  it('keeps both sides when two people rate at once', () => {
    const local = family({ turns: [{ ...turn('t1', 'a', '2026-08-09'), ratings: { me: 5 } }] });
    const remote = family({ turns: [{ ...turn('t1', 'a', '2026-08-09'), ratings: { you: 3 } }] });
    expect(mergeFamily(local, remote).turns[0].ratings).toEqual({ me: 5, you: 3 });
  });

  it('averages what everyone gave', () => {
    const rated = { ...turn('t1', 'a', '2026-08-09'), ratings: { a: 5, b: 4, c: 3 } };
    expect(verdict(rated)).toEqual({ average: 4, votes: 3 });
  });

  it('counts a turn rated before ratings were per person as one vote', () => {
    expect(verdict({ ...turn('t1', 'a', '2026-08-09'), rating: 4 })).toEqual({ average: 4, votes: 1 });
  });

  it('has no verdict until somebody says something', () => {
    expect(verdict(turn('t1', 'a', '2026-08-09'))).toBeNull();
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

describe('turns logged on the same day', () => {
  it('order by time, so two phones agree on who is up', () => {
    const morning = { id: 'x', personId: 'a', madeAt: '2026-08-15T07:10:00.000Z', skipped: false };
    const evening = { id: 'b', personId: 'b', madeAt: '2026-08-15T19:40:00.000Z', skipped: false };

    const merged = mergeFamily(family({ turns: [morning] }), family({ turns: [evening] }));
    expect(merged.turns.map((t) => t.id)).toEqual(['b', 'x']);
  });
});

describe('joining by pasted text', () => {
  it('takes a code straight', () => {
    expect(familyIdFromInput('abc12345')).toBe('abc12345');
    expect(familyIdFromInput('  abc12345  ')).toBe('abc12345');
  });

  it('digs the code out of a whole link', () => {
    expect(familyIdFromInput('https://toastturn.app/f/abc12345')).toBe('abc12345');
    expect(familyIdFromInput('https://toastturn.app/f/abc12345?x=1')).toBe('abc12345');
  });

  it('refuses what is neither', () => {
    expect(familyIdFromInput('')).toBeNull();
    expect(familyIdFromInput('   ')).toBeNull();
    expect(familyIdFromInput('no')).toBeNull();
    expect(familyIdFromInput('nope')).toBeNull();
    expect(familyIdFromInput('two words')).toBeNull();
  });
});
