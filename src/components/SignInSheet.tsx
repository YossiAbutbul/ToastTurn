import { useState } from 'react';
import { Sheet } from './Sheet';
import { en } from '../i18n/en';
import { signInProblem, signInWithGoogle, signOut } from '../lib/auth';
import type { Account } from '../lib/auth';
import './SignInSheet.css';

type SignInSheetProps = {
  open: boolean;
  account: Account | null;
  onClose: () => void;
  /**
   * The account that just signed in, handed over rather than left to be read
   * off the next render: whoever opened this sheet is usually waiting to carry
   * on with something, and the account they can see is still the old one.
   */
  onSignedIn?: (account: Account) => void;
};

/**
 * Only whoever runs a rotation ever opens this. Everyone else has an account
 * already, quietly, and was never asked for anything.
 */
export function SignInSheet({ open, account, onClose, onSignedIn }: SignInSheetProps) {
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const withGoogle = async () => {
    setBusy(true);
    setProblem(null);
    try {
      const result = await signInWithGoogle();
      if (result === 'redirecting') return;
      onClose();
      onSignedIn?.(result);
    } catch (error) {
      setProblem(en.signIn.problem[signInProblem(error)]);
    } finally {
      setBusy(false);
    }
  };

  if (account && !account.isAnonymous) {
    return (
      <Sheet open={open} title={en.signIn.signedInTitle} onClose={onClose}>
        <p className="empty">{en.signIn.signedInAs(account.email ?? '')}</p>
        <button className="ghost" type="button" onClick={() => void signOut()}>
          {en.signIn.signOut}
        </button>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} title={en.signIn.title} onClose={onClose}>
      <p className="empty">{en.signIn.blurb}</p>

      <button
        className="ghost google primary"
        type="button"
        disabled={busy}
        onClick={() => void withGoogle()}
      >
        {/* Google's own mark, so the button is recognisable as theirs. */}
        <svg className="google-g" viewBox="0 0 48 48" aria-hidden="true">
          <path
            className="g-blue"
            d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"
          />
          <path
            className="g-green"
            d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"
          />
          <path
            className="g-yellow"
            d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z"
          />
          <path
            className="g-red"
            d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"
          />
        </svg>
        {en.signIn.google}
      </button>

      {problem && <p className="problem">{problem}</p>}
      {busy && <p className="empty">{en.signIn.working}</p>}
    </Sheet>
  );
}
