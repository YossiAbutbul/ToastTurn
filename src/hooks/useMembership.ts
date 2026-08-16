import { useCallback, useEffect, useMemo, useState } from 'react';
import { syncConfigured } from '../lib/firebase';
import { pushMember, subscribeMembers } from '../lib/remote';
import type { Account } from '../lib/auth';
import type { Family, Person } from '../lib/types';

export type Membership = {
  status: 'pending' | 'approved';
  /** Which person in the rotation this account is, once the owner has let them in. */
  personId?: string;
  /** What they said their name is when they asked to join. */
  name?: string;
  email?: string;
  /**
   * Their own choice of colour. It lives here rather than on the person
   * because only the owner's account may write the people, and everybody gets
   * to choose their own.
   */
  color?: string;
};

export type MemberState = 'signed-out' | 'stranger' | 'pending' | 'member' | 'owner';

/**
 * Who is in the rotation, by account. Having the link is enough to ask; only
 * the owner can let anyone in, which is enforced by the rules as well as here.
 */
export type MembershipState = ReturnType<typeof useMembership>;

export function useMembership(family: Family, account: Account | null, isOwner: boolean) {
  const [members, setMembers] = useState<Record<string, Membership>>({});

  useEffect(() => {
    if (!syncConfigured) return;
    return subscribeMembers(family.id, (raw) => setMembers(raw as Record<string, Membership>));
  }, [family.id]);

  const mine = account ? members[account.uid] : undefined;

  // With no keys there is no sync and no accounts: the app is one phone's, and
  // whoever holds it runs the rotation.
  const state: MemberState = !syncConfigured
    ? 'owner'
    : !account
    ? 'signed-out'
    : isOwner
      ? 'owner'
      : mine?.status === 'approved'
        ? 'member'
        : mine?.status === 'pending'
          ? 'pending'
          : 'stranger';

  const write = useCallback(
    (entry: Membership) => {
      if (!account) return;
      setMembers((current) => ({ ...current, [account.uid]: entry }));
      void pushMember(family.id, account.uid, entry);
    },
    [account, family.id],
  );

  /** Ask to be let in, saying who you are. */
  const askToJoin = useCallback(
    (name: string) => write({ status: 'pending', name: name.trim(), email: account?.email ?? undefined }),
    [account, write],
  );

  /**
   * Your colour, kept under your own key. The owner does not come through
   * here: they can write the people themselves, so their choice goes straight
   * onto the person and reaches phones that never load this document.
   */
  const setColor = useCallback(
    (color: string) => {
      if (!mine) return;
      write({ ...mine, color });
    },
    [mine, write],
  );

  /** Owner only: let someone in as the person they will be in the rotation. */
  const approve = useCallback(
    (uid: string, personId: string) => {
      const next: Membership = { ...members[uid], status: 'approved', personId };
      setMembers((current) => ({ ...current, [uid]: next }));
      void pushMember(family.id, uid, next);
    },
    [family.id, members],
  );

  const myPersonId = isOwner ? (family.ownerPersonId ?? mine?.personId) : mine?.personId;
  const me: Person | null =
    (isOwner || state === 'member') && myPersonId
      ? (family.people.find((p) => p.id === myPersonId) ?? null)
      : null;

  // Everyone who has chosen a colour, by the person they are in the rotation.
  const colorsByPerson = useMemo(() => {
    const byPerson: Record<string, string> = {};
    for (const entry of Object.values(members)) {
      if (entry.status === 'approved' && entry.personId && entry.color) {
        byPerson[entry.personId] = entry.color;
      }
    }
    return byPerson;
  }, [members]);

  // Who could answer an ask: a person with an account behind them. The owner
  // counts, whether or not they ever wrote themselves a membership entry.
  const answerablePersonIds = useMemo(() => {
    const ids = new Set<string>();
    // The owner never had to ask to be let in, so they are not in the members
    // document at all, but they are certainly reachable.
    if (family.ownerPersonId) ids.add(family.ownerPersonId);
    for (const entry of Object.values(members)) {
      if (entry.status === 'approved' && entry.personId) ids.add(entry.personId);
    }
    return ids;
  }, [family.ownerPersonId, members]);

  const waiting = Object.entries(members)
    .filter(([, entry]) => entry.status === 'pending')
    .map(([uid, entry]) => ({ uid, name: entry.name ?? '', email: entry.email ?? uid }));

  return {
    state,
    me,
    waiting,
    askToJoin,
    approve,
    setColor,
    colorsByPerson,
    answerablePersonIds,
    canLog: state === 'owner' || state === 'member',
  };
}
