import { useState } from 'react';
import { Home } from './screens/Home';
import { Setup } from './screens/Setup';
import { Welcome } from './screens/Welcome';
import { useSync } from './hooks/useSync';
import { useFamily } from './store/useFamily';
import { replacePath } from './lib/history';
import { syncConfigured } from './lib/firebase';

/**
 * Three screens, no router. A share link opens straight into the rotation it
 * names, where the phone says which person it is; one with nothing open starts
 * at the welcome.
 */
export function App() {
  const { state } = useFamily();
  const sync = useSync();
  /** 'auto' means: the rotation if there is one, otherwise the welcome. */
  const [screen, setScreen] = useState<'auto' | 'welcome' | 'setup' | 'new'>('auto');

  if (!state.ready) return null;
  // Whether anyone is signed in decides which screen this is, so it is worth
  // the moment it takes to find out rather than showing the wrong one first.
  if (syncConfigured && !sync.authReady) return null;

  // Every phone has an account by now, its own and quietly: the one thing
  // still worth waiting on is the rotation a link names.
  const lockedOut = syncConfigured && !sync.account;

  // Someone opened a share link: wait for that rotation rather than offering to
  // set up a new one, unless the server says there is no such rotation.
  if (sync.joining && !state.family && !sync.missing && !lockedOut) return null;

  // 'new' is the same screen with nothing filled in: a second rotation, kept
  // alongside the ones this phone already has.
  if (screen === 'setup' || screen === 'new') {
    return (
      <Setup
        fresh={screen === 'new'}
        onDone={() => setScreen('auto')}
        // Back to the rotation if there is one to go back to, and to the
        // welcome if this phone has nothing yet.
        onBack={() => setScreen(state.family ? 'auto' : 'welcome')}
      />
    );
  }

  if (state.family && screen === 'auto' && !lockedOut) {
    return (
      <Home
        onEditPeople={() => setScreen('setup')}
        onNewFamily={() => setScreen('new')}
        // The rotation stays open behind it: this is a way to the front door,
        // not a way out of the family.
        onHome={() => setScreen('welcome')}
        onLeave={() => {
          // Drop the link from the address bar too, or it would let them back in.
          replacePath('/');
          setScreen('welcome');
        }}
      />
    );
  }

  return (
    <Welcome
      onStart={() => setScreen('new')}
      onOpen={state.family ? () => setScreen('auto') : undefined}
      notFound={sync.missing}
    />
  );
}
