import { useAccount } from './useAccount';
import type { Family } from '../lib/types';

/**
 * Whether this device may run the family. A family with no owner yet — made
 * before anyone signed in, or on a phone with no keys — belongs to whoever is
 * holding it, and is claimed by the first account to sign in.
 */
export function useIsOwner(family: Family): boolean {
  const { account } = useAccount();
  if (!family.ownerUid) return true;
  return family.ownerUid === account?.uid;
}
