import { useState } from 'react';
import { Home } from './screens/Home';
import { Setup } from './screens/Setup';
import { useSync } from './hooks/useSync';
import { useFamily } from './store/useFamily';

/** Two screens, no router: setup until there is a family, then home. */
export function App() {
  const { state } = useFamily();
  const sync = useSync();
  const [editing, setEditing] = useState(false);

  if (!state.ready) return null;
  // Someone opened a share link: wait for that family rather than offering to
  // set up a new one.
  if (sync.joining && !state.family) return null;
  if (!state.family || editing) return <Setup onDone={() => setEditing(false)} />;
  return <Home onEditPeople={() => setEditing(true)} />;
}
