import { familyIdFromPath } from './url';

/**
 * Whether this page load began on a share link.
 *
 * Read once, at load, because the app rewrites the address bar to /f/{id} for
 * sharing — so by the time anything asks, the address alone can no longer tell
 * "someone sent me this link" from "this phone once had a rotation".
 */
export const ARRIVED_BY_LINK =
  typeof window !== 'undefined' && Boolean(familyIdFromPath(window.location.pathname));
