import { useEffect, useState } from 'react';
import { syncConfigured } from '../lib/firebase';
import { pushFamily, pushTurns, subscribeFamily } from '../lib/remote';
import type { RemoteFamily } from '../lib/remote';
import { metaChanged, unsentTurns } from '../lib/mergeFamily';
import { familyIdFromPath, pathForFamily } from '../lib/url';
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
  const [remote, setRemote] = useState<Family | null>(null);

  const localId = state.family?.id ?? null;
  const linkId = typeof window === 'undefined' ? null : familyIdFromPath(window.location.pathname);
  const familyId = linkId ?? localId;

  // Opening /f/{id} for a family this phone doesn't have means joining it.
  const joining = linkId && linkId !== localId ? linkId : null;

  // Keep the address bar on the family, so the link is always shareable.
  useEffect(() => {
    if (!localId || linkId === localId) return;
    window.history.replaceState(null, '', pathForFamily(localId));
  }, [linkId, localId]);

  useEffect(() => {
    if (!syncConfigured || !familyId || !state.ready) return;

    return subscribeFamily(familyId, (incoming: RemoteFamily) => {
      if (!incoming) {
        setRemote(null);
        return;
      }
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
    if (metaChanged(family, remote)) void pushFamily(family);
  }, [remote, state.family, state.ready]);

  return {
    configured: syncConfigured,
    joining,
    /** True once the family has been seen from the other side. */
    synced: remote !== null,
  };
}
