import { useState } from 'react';
import { Home } from './screens/Home';
import { Setup } from './screens/Setup';
import { useFamily } from './store/useFamily';

/** Two screens, no router: setup until there is a family, then home. */
export function App() {
  const { state } = useFamily();
  const [editing, setEditing] = useState(false);

  if (!state.ready) return null;
  if (!state.family || editing) return <Setup onDone={() => setEditing(false)} />;
  return <Home onEditPeople={() => setEditing(true)} />;
}
