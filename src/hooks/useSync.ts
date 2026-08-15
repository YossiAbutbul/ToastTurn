import { useEffect, useRef, useState } from 'react';
import { syncConfigured } from '../lib/firebase';
import { pushFamily, pushTurns, subscribeFamily } from '../lib/remote';
import type { RemoteFamily } from '../lib/remote';
import { metaChanged, unsentTurns } from '../lib/mergeFamily';
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
  const { account } = useAccount();
  const [remote, setRemote] = useState<Family | null>(null);
  /** Which family the server has answered about, whether or not it exists. */
  const [checkedId, setCheckedId] = useState<string | null>(null);
  /** Whether this family has ever been seen on the server. */
  const sawRemote = useRef(false);

  const localId = state.family?.id ?? null;
  const linkId = typeof window === 'undefined' ? null : familyIdFromPath(window.location.pathname);
  const familyId = linkId ?? localId;

  // Opening /f/{id} for a family this phone doesn't have means joining it.
  const joining = linkId && linkId !== localId ? linkId : null;

  // Keep the address bar on the family, so the link is always shareable — but
  // only once someone is signed in, or the rewritten address would outlive the
  // sign-out that was meant to close it.
  useEffect(() => {
    if (!localId || linkId === localId) return;
    if (syncConfigured && !account) return;
    window.history.replaceState(null, '', pathForFamily(localId));
  }, [account, linkId, localId]);

  useEffect(() => {
    if (!syncConfigured || !familyId || !state.ready) return;

    return subscribeFamily(familyId, (incoming: RemoteFamily) => {
      setCheckedId(familyId);
      if (!incoming) {
        setRemote(null);
        // It was there and now it isn't: someone cleared the family. Let it go
        // rather than republishing it from this phone's copy.
        if (sawRemote.current) {
          sawRemote.current = false;
          dispatch({ type: 'reset' });
          window.history.replaceState(null, '', '/');
        }
        return;
      }
      sawRemote.current = true;
      setRemote(incoming);
      dispatch({ type: 'applyRemote', family: incoming });
    });
  }, [dispatch, familyId, state.ready]);

  // Anything this phone changed goes up. Turns first — they are what people
  // are waiting to see.
  useEffect(() => {
    const family = state.family;
    if (!syncConfigured || !family || !state.ready) return;

    const seen = new Set((remote?.turns ?? []).map((t) => t.id));
    const pending = unsentTurns(family, seen);
    if (pending.length > 0) void pushTurns(family.id, pending);

    // Only the signed-in owner publishes the family itself. A family with no
    // owner yet is claimed by the first account that signs in on it.
    const owned = family.ownerUid ? family.ownerUid === account?.uid : Boolean(account);
    if (owned && metaChanged(family, remote)) void pushFamily(family, account?.uid);
  }, [account, remote, state.family, state.ready]);

  return {
    configured: syncConfigured,
    joining,
    account,
    /** The link points at a rotation that isn't there. */
    missing: Boolean(joining) && checkedId === familyId && remote === null,
    /** True once the family has been seen from the other side. */
    synced: remote !== null,
  };
}
