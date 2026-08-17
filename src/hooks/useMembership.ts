import { useCallback, useEffect, useMemo, useState } from 'react';
import { syncConfigured } from '../lib/firebase';
import { pushMember, pushPeople, subscribeMembers } from '../lib/remote';
import { newId } from '../lib/id';
import { colorForIndex } from '../lib/palette';
import type { Account } from '../lib/auth';
import type { Family, Person } from '../lib/types';

export type Membership = {
  /** Which person in the rotation this phone said it is. */
  personId: string;
  /** What they called themselves, kept for the settings screen. */
  name?: string;
  /**
   * Their own choice of colour. It lives here rather than on the person
   * because the rotation is the owner's to arrange, and everybody gets to
   * choose their own.
   */
  color?: string;
};

export type MemberState = 'unclaimed' | 'member' | 'owner';

/**
 * Which person this phone is.
 *
 * Nobody asks to join and nobody approves them. The owner wrote the names when
 * they made the rotation; opening the link and tapping your own name is the
 * whole of joining. What the server holds is that claim - this account is that
 * person - and it holds every write to it.
 */
export type MembershipState = ReturnType<typeof useMembership>;

export function useMembership(family: Family, account: Account | null, isOwner: boolean) {
  const [members, setMembers] = useState<Record<string, Membership>>({});

  useEffect(() => {
    if (!syncConfigured) return;
    return subscribeMembers(family.id, (raw) => setMembers(raw as Record<string, Membership>));
  }, [family.id]);

  const mine = account ? members[account.uid] : undefined;
  const claimed = mine?.personId && family.people.some((p) => p.id === mine.personId);

  // With no keys there is no sync and no accounts: the app is one phone's, and
  // whoever holds it runs the rotation.
  const state: MemberState = !syncConfigured
    ? 'owner'
    : isOwner
      ? 'owner'
      : claimed
        ? 'member'
        : 'unclaimed';

  const write = useCallback(
    (entry: Membership) => {
      if (!account) return;
      setMembers((current) => ({ ...current, [account.uid]: entry }));
      void pushMember(family.id, account.uid, entry);
    },
    [account, family.id],
  );

  /** Say which of the names on the list is you. */
  const claim = useCallback(
    (personId: string, name?: string) => write({ ...mine, personId, name }),
    [mine, write],
  );

  /**
   * Nobody on the list is you. Putting yourself in the rotation is a person of
   * your own, written by you - which is why they are documents rather than a
   * list on the family, a list being something only its owner could write.
   */
  const joinAs = useCallback(
    async (name: string) => {
      const person: Person = {
        id: newId(),
        name: name.trim(),
        color: colorForIndex(family.people.length),
        order: family.people.length,
        active: true,
      };
      await pushPeople(family.id, [person]);
      claim(person.id, person.name);
    },
    [claim, family.id, family.people.length],
  );

  /** Your colour, kept under your own key rather than on the person. */
  const setColor = useCallback(
    (color: string) => {
      if (!mine) return;
      write({ ...mine, color });
    },
    [mine, write],
  );

  const person = (id: string | undefined) =>
    id ? (family.people.find((p) => p.id === id) ?? null) : null;

  // The owner is whoever the family says, and failing that whoever this phone
  // claimed. Naming somebody who is no longer in the rotation counts as
  // failing: a person taken out and an empty field are the same thing to read,
  // and treating them differently left the owner as nobody, unable to order
  // even for themselves, with nothing on screen to put it right.
  const me: Person | null = isOwner
    ? (person(family.ownerPersonId) ?? person(mine?.personId))
    : person(mine?.personId);

  // Everyone who has chosen a colour, by the person they are in the rotation.
  const colorsByPerson = useMemo(() => {
    const byPerson: Record<string, string> = {};
    for (const entry of Object.values(members)) {
      if (entry?.personId && entry.color) byPerson[entry.personId] = entry.color;
    }
    return byPerson;
  }, [members]);

  // Which people already belong to a phone, so the list of names to claim can
  // say so. It does not stop anyone: a phone that was wiped has to be able to
  // say who it is again.
  const takenPersonIds = useMemo(() => {
    const ids = new Set<string>();
    if (family.ownerPersonId) ids.add(family.ownerPersonId);
    for (const [uid, entry] of Object.entries(members)) {
      if (entry?.personId && uid !== account?.uid) ids.add(entry.personId);
    }
    return ids;
  }, [account?.uid, family.ownerPersonId, members]);

  return {
    state,
    me,
    claim,
    joinAs,
    setColor,
    colorsByPerson,
    takenPersonIds,
    canLog: state === 'owner' || state === 'member',
  };
}
