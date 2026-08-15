import { useEffect, useState } from 'react';
import { currentUid } from '../lib/firebase';
import type { Family } from '../lib/types';

/**
 * Whether this phone started the family. A family with no owner — made before
 * sync, or on a phone that never had keys — belongs to whoever is holding it.
 */
export function useIsOwner(family: Family): boolean {
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    void currentUid().then((id) => {
      if (live) setUid(id);
    });
    return () => {
      live = false;
    };
  }, []);

  if (!family.ownerUid) return true;
  return family.ownerUid === uid;
}
