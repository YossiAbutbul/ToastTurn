import { useState } from 'react';
import { Home } from './screens/Home';
import { Setup } from './screens/Setup';
import { Welcome } from './screens/Welcome';
import { Invite } from './screens/Invite';
import { useSync } from './hooks/useSync';
import { useFamily } from './store/useFamily';
import { replacePath } from './lib/history';
import { syncConfigured } from './lib/firebase';

/**
 * Four screens, no router. A share link asks for a sign-in and names the
 * rotation it is for; a phone with nothing open starts at the welcome.
 */
export function App() {
  const { state, dispatch } = useFamily();
  const sync = useSync();
  /** 'auto' means: the rotation if there is one, otherwise the welcome. */
  const [screen, setScreen] = useState<'auto' | 'welcome' | 'setup' | 'new'>('auto');

  if (!state.ready) return null;
  // Someone opened a share link: wait for that rotation rather than offering to
  // set up a new one, unless the server says there is no such rotation.
  if (sync.joining && !state.family && !sync.missing) return null;

  // Nothing shows before a sign-in, a link is an invitation to ask, not a
  // window into the rotation.
  const lockedOut = syncConfigured && !sync.account;

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

  // A link, and nobody signed in: the invitation itself, which says which
  // rotation it is for and asks for a sign-in. Only its name is shown.
  if (sync.linkId && lockedOut && !sync.missing) {
    return (
      <Invite
        familyName={state.family?.id === sync.linkId ? state.family.name : undefined}
        onLeave={() => {
          // Turning the invitation down gives the rotation back: it was never
          // this phone's, it only came down to put a name on the screen.
          if (state.family?.id === sync.linkId) dispatch({ type: 'reset' });
          replacePath('/');
          setScreen('welcome');
        }}
      />
    );
  }

  if (state.family && screen === 'auto' && !lockedOut) {
    return (
      <Home
        onEditPeople={() => setScreen('setup')}
        onNewFamily={() => setScreen('new')}
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
