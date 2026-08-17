import { useAccount } from './useAccount';
import { syncConfigured } from '../lib/firebase';
import type { Family } from '../lib/types';

/**
 * Whether this device may run the family.
 *
 * Every phone has an account now, whether or not anyone asked for one, so
 * "signed in" no longer means anything by itself: an unclaimed family is
 * claimed by the first account behind a real sign-in, and never by the
 * anonymous one a phone gives itself. Otherwise whoever opened the link first
 * would end up running the rotation.
 */
export function useIsOwner(family: Family): boolean {
  const { account } = useAccount();
  if (!syncConfigured) return true;
  if (!family.ownerUid) return Boolean(account) && !account!.isAnonymous;
  return family.ownerUid === account?.uid;
}
