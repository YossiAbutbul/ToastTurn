import { useEffect, useState } from 'react';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import './WhoseName.css';

type WhoseNameProps = {
  personId: string;
  name: string;
};

/** How long the old name takes to leave and the new one to arrive. */
const SWAP_MS = 720;

/**
 * The one name the whole app is for.
 *
 * When the turn moves on it changes hands rather than blinking: the old name
 * lifts out of the frame the way toast leaves the slot, and the new one
 * springs up in its place. Both are drawn in the same grid cell, so nothing
 * below them moves while it happens.
 */
export function WhoseName({ personId, name }: WhoseNameProps) {
  const reduced = usePrefersReducedMotion();
  const [shown, setShown] = useState({ personId, name });
  const [leaving, setLeaving] = useState<{ personId: string; name: string } | null>(null);

  // Read during the render that brings the new name in, so the two are on
  // screen together from the first frame rather than a frame later.
  if (personId !== shown.personId) {
    setLeaving(shown);
    setShown({ personId, name });
  }

  useEffect(() => {
    if (!leaving) return;
    const timer = window.setTimeout(() => setLeaving(null), reduced ? 20 : SWAP_MS);
    return () => window.clearTimeout(timer);
  }, [leaving, reduced]);

  return (
    <div className="big">
      {leaving && (
        <span key={leaving.personId} className="big-name leaving">
          {leaving.name}
        </span>
      )}
      <span key={shown.personId} className={leaving ? 'big-name arriving' : 'big-name'}>
        {shown.name}
      </span>
    </div>
  );
}
