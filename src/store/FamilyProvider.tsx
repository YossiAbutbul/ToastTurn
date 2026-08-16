import { useEffect, useMemo, useReducer } from 'react';
import type { ReactNode } from 'react';
import { FamilyContext } from './familyContext';
import { allFamilies, familyReducer, initialState } from './familyReducer';
import { clearFamilies, loadFamilies, saveFamilies } from '../lib/storage';

export function FamilyProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(familyReducer, initialState);

  useEffect(() => {
    dispatch({ type: 'hydrate', families: loadFamilies() });
  }, []);

  useEffect(() => {
    if (!state.ready) return;
    const families = allFamilies(state);
    if (families.length > 0) saveFamilies(families);
    else clearFamilies();
  }, [state]);

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <FamilyContext.Provider value={value}>{children}</FamilyContext.Provider>;
}
