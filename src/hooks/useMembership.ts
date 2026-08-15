import { useCallback, useEffect, useState } from 'react';
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

  const waiting = Object.entries(members)
    .filter(([, entry]) => entry.status === 'pending')
    .map(([uid, entry]) => ({ uid, name: entry.name ?? '', email: entry.email ?? uid }));

  return { state, me, waiting, askToJoin, approve, canLog: state === 'owner' || state === 'member' };
}
