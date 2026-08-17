import { describe, expect, it } from 'vitest';
import { goneFromRotation, unsentPeople } from './mergeFamily';
import type { Family, Person } from './types';

const person = (id: string, over: Partial<Person> = {}): Person => ({
  id,
  name: id.toUpperCase(),
  color: '#E9553D',
  order: 0,
  active: true,
  ...over,
});

const family = (people: Person[]): Family => ({
  id: 'fam',
  name: 'The Abutbuls',
  people,
  schedule: { weekday: 0, time: '20:00', remind: true },
  turns: [],
});

describe('unsentPeople', () => {
  it('sends everyone when nothing is up yet', () => {
    const local = family([person('a'), person('b')]);
    expect(unsentPeople(local, null).map((p) => p.id)).toEqual(['a', 'b']);
  });

  it('sends nobody when both sides agree', () => {
    const local = family([person('a'), person('b')]);
    expect(unsentPeople(local, family([person('b'), person('a')]))).toEqual([]);
  });

  it('sends only the person who changed', () => {
    const local = family([person('a', { name: 'Maya' }), person('b')]);
    const remote = family([person('a'), person('b')]);
    expect(unsentPeople(local, remote).map((p) => p.id)).toEqual(['a']);
  });

  it('notices a move in the order, not just a rename', () => {
    const local = family([person('a', { order: 3 })]);
    expect(unsentPeople(local, family([person('a')])).map((p) => p.id)).toEqual(['a']);
  });
});

describe('goneFromRotation', () => {
  it('names whoever the others still have and this phone does not', () => {
    const local = family([person('a')]);
    expect(goneFromRotation(local, family([person('a'), person('b')]))).toEqual(['b']);
  });

  it('names nobody when the rotation has only grown', () => {
    const local = family([person('a'), person('b')]);
    expect(goneFromRotation(local, family([person('a')]))).toEqual([]);
  });

  it('names nobody when nothing is up yet', () => {
    expect(goneFromRotation(family([person('a')]), null)).toEqual([]);
  });
});
