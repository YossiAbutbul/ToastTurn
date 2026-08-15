import { useState } from 'react';
import { Home } from './screens/Home';
import { Setup } from './screens/Setup';
import { Welcome } from './screens/Welcome';
import { useSync } from './hooks/useSync';
import { useFamily } from './store/useFamily';

/**
 * Three screens, no router. A share link goes straight to the rotation; a phone
 * with nothing on it starts at the welcome.
 */
export function App() {
  const { state } = useFamily();
  const sync = useSync();
  /** 'auto' means: the rotation if there is one, otherwise the welcome. */
  const [screen, setScreen] = useState<'auto' | 'welcome' | 'setup'>('auto');

  if (!state.ready) return null;
  // Someone opened a share link: wait for that rotation rather than offering to
  // set up a new one — unless the server says there is no such rotation.
  if (sync.joining && !state.family && !sync.missing) return null;

  if (screen === 'setup') return <Setup onDone={() => setScreen('auto')} />;

  if (state.family && screen === 'auto') {
    return <Home onEditPeople={() => setScreen('setup')} onLeave={() => setScreen('welcome')} />;
  }

  return (
    <Welcome
      onStart={() => setScreen('setup')}
      onOpen={state.family ? () => setScreen('auto') : undefined}
      notFound={sync.missing}
    />
  );
}
