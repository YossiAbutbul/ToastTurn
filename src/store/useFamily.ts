import { useContext } from 'react';
import { FamilyContext } from './familyContext';

export function useFamily() {
  const value = useContext(FamilyContext);
  if (!value) throw new Error('useFamily must be used inside <FamilyProvider>');
  return value;
}
