import { useEffect, useMemo, useReducer } from 'react';
import type { ReactNode } from 'react';
import { FamilyContext } from './familyContext';
import { familyReducer, initialState } from './familyReducer';
import { clearFamily, loadFamily, saveFamily } from '../lib/storage';

export function FamilyProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(familyReducer, initialState);

  useEffect(() => {
    dispatch({ type: 'hydrate', family: loadFamily() });
  }, []);

  useEffect(() => {
    if (!state.ready) return;
    if (state.family) saveFamily(state.family);
    else clearFamily();
  }, [state.family, state.ready]);

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <FamilyContext.Provider value={value}>{children}</FamilyContext.Provider>;
}
