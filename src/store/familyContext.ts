import { createContext } from 'react';
import type { Dispatch } from 'react';
import type { Action, State } from './familyReducer';

export type FamilyContextValue = {
  state: State;
  dispatch: Dispatch<Action>;
};

export const FamilyContext = createContext<FamilyContextValue | null>(null);
