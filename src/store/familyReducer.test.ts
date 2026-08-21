import { describe, expect, it } from 'vitest';
import { familyReducer, initialState } from './familyReducer';
import type { State } from './familyReducer';
import type { Family, Person } from '../lib/types';

const person = (id: string, order: number): Person => ({
  id,
  name: id.toUpperCase(),
  color: '#E9553D',
  order,
  active: true,
});

const family = (over: Partial<Family> = {}): Family => ({
  id: 'fam',
  name: 'Test',
  people: [person('a', 0), person('b', 1), person('c', 2)],
  turns: [],
  ...over,
});

const ready = (over: Partial<Family> = {}): State => ({
  family: family(over),
  others: [],
  ready: true,
});

describe('familyReducer', () => {
  it('ignores everything but hydrate until there is a family', () => {
    const next = familyReducer(initialState, { type: 'logTurn', id: 't1', madeAt: '2026-08-16' });
    expect(next).toBe(initialState);
  });

  it('folds a remote family in without dropping a local turn', () => {
    const state = ready({ turns: [{ id: 'mine', personId: 'a', madeAt: '2026-08-16', skipped: false }] });
    const next = familyReducer(state, {
      type: 'applyRemote',
      family: family({
        name: 'Renamed',
        turns: [{ id: 'theirs', personId: 'b', madeAt: '2026-08-09', skipped: false }],
      }),
    });

    expect(next.family?.name).toBe('Renamed');
    expect(next.family?.turns.map((t) => t.id)).toEqual(['mine', 'theirs']);
  });

  it('renumbers order when a person is added or removed', () => {
    const added = familyReducer(ready(), { type: 'addPerson', person: person('d', 99) });
    expect(added.family?.people.map((p) => p.order)).toEqual([0, 1, 2, 3]);

    const removed = familyReducer(added, { type: 'removePerson', id: 'b' });
    expect(removed.family?.people.map((p) => `${p.id}${p.order}`)).toEqual(['a0', 'c1', 'd2']);
  });

  it('takes the rotation in the sequence it was arranged into', () => {
    const moved = familyReducer(ready(), { type: 'reorderPeople', ids: ['b', 'c', 'a'] });
    expect(moved.family?.people.map((p) => p.id)).toEqual(['b', 'c', 'a']);
    expect(moved.family?.people.map((p) => p.order)).toEqual([0, 1, 2]);
  });

  it('keeps anyone the sequence never named, rather than dropping them', () => {
    const moved = familyReducer(ready(), { type: 'reorderPeople', ids: ['c', 'a'] });
    expect(moved.family?.people.map((p) => p.id)).toEqual(['c', 'a', 'b']);
  });

  it('ignores names that are not in the rotation', () => {
    const state = ready();
    expect(familyReducer(state, { type: 'reorderPeople', ids: ['nobody'] })).toBe(state);
  });

  it('stands the open rotation behind a new one rather than dropping it', () => {
    const next = familyReducer(ready(), { type: 'createFamily', family: family({ id: 'second' }) });
    expect(next.family?.id).toBe('second');
    expect(next.others.map((f) => f.id)).toEqual(['fam']);
  });

  it('switches to a rotation this phone already holds', () => {
    const two = familyReducer(ready(), { type: 'createFamily', family: family({ id: 'second' }) });
    const back = familyReducer(two, { type: 'switchFamily', id: 'fam' });
    expect(back.family?.id).toBe('fam');
    expect(back.others.map((f) => f.id)).toEqual(['second']);
  });

  it('opens a rotation arriving from a link without losing the others', () => {
    const next = familyReducer(ready(), { type: 'applyRemote', family: family({ id: 'linked' }) });
    expect(next.family?.id).toBe('linked');
    expect(next.others.map((f) => f.id)).toEqual(['fam']);
  });

  it('opens the next rotation when the open one is left', () => {
    const two = familyReducer(ready(), { type: 'createFamily', family: family({ id: 'second' }) });
    const gone = familyReducer(two, { type: 'reset' });
    expect(gone.family?.id).toBe('fam');
    expect(gone.others).toEqual([]);
    expect(familyReducer(gone, { type: 'reset' }).family).toBeNull();
  });

  it('renames the family without touching the rest of it', () => {
    const next = familyReducer(ready(), { type: 'renameFamily', name: 'The Cohens' });
    expect(next.family?.name).toBe('The Cohens');
    expect(next.family?.people).toEqual(ready().family?.people);
  });
});
