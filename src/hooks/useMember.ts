import { useCallback, useEffect, useState } from 'react';
import { syncConfigured } from '../lib/firebase';
import { pushMember, subscribeMembers } from '../lib/remote';
import type { Family, Person } from '../lib/types';

/**
 * Which person the signed-in account is. Asked once, then remembered against
 * the account — so a new phone, or the same person on someone else's phone,
 * already knows.
 */
export function useMember(family: Family, uid: string | undefined) {
  const [members, setMembers] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!syncConfigured) return;
    return subscribeMembers(family.id, setMembers);
  }, [family.id]);

  const claim = useCallback(
    (personId: string) => {
      if (!uid) return;
      setMembers((current) => ({ ...current, [uid]: personId }));
      void pushMember(family.id, uid, personId);
    },
    [family.id, uid],
  );

  const personId = uid ? members[uid] : undefined;
  const me: Person | null = family.people.find((p) => p.id === personId) ?? null;

  /** True when someone is signed in but has not said who they are yet. */
  const unclaimed = Boolean(uid) && !personId && family.people.length > 0;

  return { me, claim, unclaimed };
}
