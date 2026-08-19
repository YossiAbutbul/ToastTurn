import { useState } from 'react';
import { Home } from './screens/Home';
import { Setup } from './screens/Setup';
import { Welcome } from './screens/Welcome';
import { Joining } from './screens/Joining';
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
  const [screen, setScreen] = useState<'auto' | 'welcome' | 'new'>('auto');
  /**
   * Whoever signed out landed on the welcome. The welcome says a different
   * sentence to them than to a phone that never had an account, and it has no
   * way of knowing which it is holding: an account signed out of is replaced
   * by an anonymous one within the moment, so by the time the screen renders
   * the two look alike.
   */
  const [signedOut, setSignedOut] = useState(false);

  if (!state.ready) return null;
  // Whether anyone is signed in decides which screen this is, so it is worth
  // the moment it takes to find out rather than showing the wrong one first.
  if (syncConfigured && !sync.authReady) return null;

  // Every phone has an account by now, its own and quietly: the one thing
  // still worth waiting on is the rotation a link names.
  const lockedOut = syncConfigured && !sync.account;

  // Someone opened a share link for a rotation this phone has not got yet.
  // Whatever it was showing before is not that rotation, so it is put away
  // until the right one arrives - or until the code turns out to name nothing,
  // which is said rather than left to be guessed at.
  if (sync.joining && state.family?.id !== sync.linkId && !lockedOut) {
    return (
      <Joining
        code={sync.joining}
        notFound={sync.missing}
        onBack={() => {
          // The link goes too, or the next render walks straight back in.
          replacePath('/');
          setScreen('welcome');
        }}
      />
    );
  }

  // A rotation of its own, kept alongside the ones this phone already has.
  if (screen === 'new') {
    return (
      <Setup
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
        onNewFamily={() => setScreen('new')}
        // The rotation stays open behind it: this is a way to the front door,
        // not a way out of the family.
        onHome={() => setScreen('welcome')}
        onLeave={() => {
          // Drop the link from the address bar too, or it would let them back in.
          replacePath('/');
          setSignedOut(true);
          setScreen('welcome');
        }}
      />
    );
  }

  return (
    <Welcome
      onStart={() => {
        setSignedOut(false);
        setScreen('new');
      }}
      onOpen={state.family ? () => setScreen('auto') : undefined}
      notFound={sync.missing}
      signedOut={signedOut}
    />
  );
}
