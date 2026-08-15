import { useState } from 'react';
import { Home } from './screens/Home';
import { Setup } from './screens/Setup';
import { Welcome } from './screens/Welcome';
import { useSync } from './hooks/useSync';
import { useFamily } from './store/useFamily';

/**
 * Three screens, no router. A share link goes straight to the family; a phone
 * with nothing on it starts at the welcome.
 */
export function App() {
  const { state } = useFamily();
  const sync = useSync();
  const [screen, setScreen] = useState<'welcome' | 'setup'>('welcome');

  if (!state.ready) return null;
  // Someone opened a share link: wait for that family rather than offering to
  // set up a new one.
  if (sync.joining && !state.family) return null;

  if (state.family && screen !== 'setup') return <Home onEditPeople={() => setScreen('setup')} />;
  if (!state.family && screen === 'welcome') return <Welcome onStart={() => setScreen('setup')} />;
  return <Setup onDone={() => setScreen('welcome')} />;
}
