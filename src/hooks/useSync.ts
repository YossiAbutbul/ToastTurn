import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { syncConfigured } from '../lib/firebase';
import { pushFamily, pushRating, pushTurns, subscribeFamily } from '../lib/remote';
import type { RemoteFamily } from '../lib/remote';
import { metaChanged, unsentRatings, unsentTurns } from '../lib/mergeFamily';
import { currentPath, replacePath, subscribePath } from '../lib/history';
import { familyIdFromPath, pathForFamily } from '../lib/url';
import { useAccount } from './useAccount';
import { useFamily } from '../store/useFamily';
import type { Family } from '../lib/types';

/**
 * Keeps this phone and the others on the same family.
 *
 * Firestore's persistent cache does the offline work: a write made on the
 * kitchen wifi dead-spot lands in the cache, shows immediately, and replays
 * itself on reconnect. Nothing here has to queue anything by hand.
 */
export function useSync() {
  const { state, dispatch } = useFamily();
  const { account, ready: authReady } = useAccount();
  /**
   * The last snapshot, tagged with the family it was of: switching rotations
   * must not compare the new one against the old one's snapshot.
   */
  const [seen, setSeen] = useState<{ id: string; family: Family | null } | null>(null);
  /** Whether this family has ever been seen on the server. */
  const sawRemote = useRef(false);
  const path = useSyncExternalStore(subscribePath, currentPath, () => '');

  const localId = state.family?.id ?? null;
  const linkId = familyIdFromPath(path);
  const familyId = linkId ?? localId;

  // A link to a rotation this phone already holds just opens that one.
  const held = linkId ? state.others.some((other) => other.id === linkId) : false;

  // Opening /f/{id} for a family this phone doesn't have means joining it.
  // Without keys nothing can arrive, so the link is not something to wait on:
  // waiting on it would leave the screen blank for good.
  const joining = syncConfigured && linkId && linkId !== localId && !held ? linkId : null;

  /** Only a snapshot of the family being watched says anything about it. */
  const remote = seen && seen.id === familyId ? seen.family : null;
  /** Whether the server has answered about it, whether or not it exists. */
  const checked = seen?.id === familyId;

  /**
   * The link, once it has had its say. A link decides which rotation opens,
   * but only the first time it is seen: after that the open rotation decides
   * the link, or switching rotations and rewriting the address would each keep
   * undoing the other.
   */
  const followed = useRef<string | null>(null);

  useEffect(() => {
    if (!localId) return;

    if (linkId && linkId !== localId && followed.current !== linkId) {
      followed.current = linkId;
      // A rotation this phone already holds opens straight away; one it does
      // not is waited for, with the link left in the address bar meanwhile.
      if (held) return dispatch({ type: 'switchFamily', id: linkId });
      if (joining) return;
    }

    if (linkId === localId) {
      followed.current = linkId;
      return;
    }

    // Keep the address bar on the open rotation, so the link is always
    // shareable, but only once someone is signed in, or the rewritten address
    // would outlive the sign-out that was meant to close it.
    if (syncConfigured && !account) return;
    replacePath(pathForFamily(localId));
  }, [account, dispatch, held, joining, linkId, localId]);

  const uid = account?.uid;

  useEffect(() => {
    if (!syncConfigured || !familyId || !state.ready) return;
    // The server tells nobody anything until they are signed in, so there is
    // nothing to listen for yet. The subscription starts itself the moment an
    // account turns up, because that is what this effect watches.
    if (!uid) return;

    // Nothing has been seen of this rotation yet, whatever was seen of the last.
    sawRemote.current = false;

    return subscribeFamily(familyId, (incoming: RemoteFamily) => {
      if (!incoming) {
        setSeen({ id: familyId, family: null });
        // It was there and now it isn't: someone cleared the family. Let it go
        // rather than republishing it from this phone's copy.
        if (sawRemote.current) {
          sawRemote.current = false;
          dispatch({ type: 'reset' });
          replacePath('/');
        }
        return;
      }
      sawRemote.current = true;
      setSeen({ id: familyId, family: incoming });
      dispatch({ type: 'applyRemote', family: incoming });
    });
  }, [dispatch, familyId, state.ready, uid]);

  // Anything this phone changed goes up. Turns first, they are what people
  // are waiting to see.
  useEffect(() => {
    const family = state.family;
    if (!syncConfigured || !family || !state.ready) return;

    const pending = unsentTurns(family, remote);
    if (pending.length > 0) void pushTurns(family.id, pending);

    for (const { turnId, rating } of unsentRatings(family, remote, account?.uid)) {
      void pushRating(family.id, turnId, account!.uid, rating);
    }

    // Only the signed-in owner publishes the family itself. A family with no
    // owner yet is claimed by the first account that signs in on it.
    const owned = family.ownerUid ? family.ownerUid === account?.uid : Boolean(account);
    if (owned && metaChanged(family, remote)) void pushFamily(family, account?.uid);
  }, [account, remote, state.family, state.ready]);

  return {
    configured: syncConfigured,
    joining,
    account,
    /** False until the sign-in has been asked about, so nothing flashes. */
    authReady,
    /** The rotation the address bar names, if it names one. */
    linkId,
    /** The link points at a rotation that isn't there. */
    missing: Boolean(joining) && checked && remote === null,
    /** True once the family has been seen from the other side. */
    synced: remote !== null,
  };
}
