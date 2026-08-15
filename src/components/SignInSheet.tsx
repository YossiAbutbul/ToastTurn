import { useState } from 'react';
import { Sheet } from './Sheet';
import { en } from '../i18n/en';
import { signIn, signInProblem, signInWithGoogle, signOut } from '../lib/auth';
import type { Account } from '../lib/auth';

type SignInSheetProps = {
  open: boolean;
  account: Account | null;
  onClose: () => void;
};

/** Only the person who runs the family ever opens this. */
export function SignInSheet({ open, account, onClose }: SignInSheetProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setProblem(null);
    try {
      await signIn(email.trim(), password);
      setPassword('');
      onClose();
    } catch (error) {
      setProblem(en.signIn.problem[signInProblem(error)]);
    } finally {
      setBusy(false);
    }
  };

  const withGoogle = async () => {
    setBusy(true);
    setProblem(null);
    try {
      const result = await signInWithGoogle();
      if (result !== 'redirecting') onClose();
    } catch (error) {
      setProblem(en.signIn.problem[signInProblem(error)]);
    } finally {
      setBusy(false);
    }
  };

  if (account) {
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

      <button className="ghost" type="button" disabled={busy} onClick={() => void withGoogle()}>
        {en.signIn.google}
      </button>
      <p className="empty">{en.signIn.or}</p>

      <div className="fieldlabel spaced">{en.signIn.email}</div>
      <input
        type="text"
        inputMode="email"
        autoComplete="username"
        aria-label={en.signIn.email}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <div className="fieldlabel spaced">{en.signIn.password}</div>
      <input
        type="password"
        autoComplete="current-password"
        aria-label={en.signIn.password}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && void submit()}
      />

      {problem && <p className="problem">{problem}</p>}

      <button className="ghost" type="button" disabled={busy} onClick={() => void submit()}>
        {busy ? en.signIn.working : en.signIn.action}
      </button>
    </Sheet>
  );
}
