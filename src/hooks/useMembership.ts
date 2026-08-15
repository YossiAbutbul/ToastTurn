import { useCallback, useEffect, useState } from 'react';
import { syncConfigured } from '../lib/firebase';
import { pushMember, subscribeMembers } from '../lib/remote';
import type { Account } from '../lib/auth';
import type { Family, Person } from '../lib/types';

export type Membership = {
  status: 'pending' | 'approved';
  personId?: string;
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

  /** Ask to be let in. */
  const askToJoin = useCallback(
    () => write({ status: 'pending', email: account?.email ?? undefined }),
    [account, write],
  );

  /** Say which person you are, once you have been let in. */
  const claim = useCallback(
    (personId: string) => write({ ...(mine ?? { status: 'approved' }), status: 'approved', personId }),
    [mine, write],
  );

  /** Owner only: let someone in, or take them back out. */
  const decide = useCallback(
    (uid: string, allowed: boolean) => {
      const entry = members[uid];
      const next: Membership = { ...entry, status: allowed ? 'approved' : 'pending' };
      setMembers((current) => ({ ...current, [uid]: next }));
      void pushMember(family.id, uid, allowed ? next : { ...next, status: 'pending' });
    },
    [family.id, members],
  );

  const me: Person | null =
    (isOwner || state === 'member') && mine?.personId
      ? (family.people.find((p) => p.id === mine.personId) ?? null)
      : null;

  const waiting = Object.entries(members)
    .filter(([, entry]) => entry.status === 'pending')
    .map(([uid, entry]) => ({ uid, email: entry.email ?? uid }));

  return { state, me, waiting, askToJoin, claim, decide, canLog: state === 'owner' || state === 'member' };
}
