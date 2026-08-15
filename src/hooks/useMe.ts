import { useCallback, useState } from 'react';
import { loadMe, saveMe } from '../lib/storage';

/** Who is holding this phone, remembered per device. */
export function useMe(familyId: string) {
  const [me, setMeState] = useState<string | null>(() => loadMe(familyId));

  const setMe = useCallback(
    (personId: string) => {
      saveMe(familyId, personId);
      setMeState(personId);
    },
    [familyId],
  );

  return { me, setMe };
}
