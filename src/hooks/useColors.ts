import { useCallback, useEffect, useState } from 'react';
import { syncConfigured } from '../lib/firebase';
import { pushColor, subscribeColors } from '../lib/remote';
import { emailKey } from '../lib/people';
import type { Person } from '../lib/types';

/**
 * The colour each person picked for their own toast, kept beside the rotation
 * and keyed by their address. That way changing your own colour is not a write
 * to the rotation itself, which only the owner may do.
 */
export function useColors(familyId: string, myEmail: string | null | undefined) {
  const [colors, setColors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!syncConfigured) return;
    return subscribeColors(familyId, setColors);
  }, [familyId]);

  const setMyColor = useCallback(
    (color: string) => {
      if (!myEmail) return;
      const key = emailKey(myEmail);
      setColors((current) => ({ ...current, [key]: color }));
      void pushColor(familyId, key, color);
    },
    [familyId, myEmail],
  );

  const colorOf = useCallback(
    (person: Person) => (person.email ? colors[emailKey(person.email)] : undefined) ?? person.color,
    [colors],
  );

  return { colorOf, setMyColor };
}
