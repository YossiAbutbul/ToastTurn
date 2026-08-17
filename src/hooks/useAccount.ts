import { useEffect, useState } from 'react';
import { watchAccount } from '../lib/auth';
import type { Account, SignInProblem } from '../lib/auth';

/**
 * Who is signed in on this device, and if nobody, why not.
 *
 * Every phone is handed an account without being asked, so "nobody" normally
 * lasts a moment. When it lasts longer something is wrong with the project
 * rather than with the person holding the phone, and the app has to be able
 * to say so instead of showing buttons that quietly do nothing.
 */
export function useAccount(): {
  account: Account | null;
  ready: boolean;
  problem: SignInProblem | null;
} {
  const [account, setAccount] = useState<Account | null>(null);
  const [ready, setReady] = useState(false);
  const [problem, setProblem] = useState<SignInProblem | null>(null);

  useEffect(
    () =>
      watchAccount(
        (next) => {
          setAccount(next);
          if (next) setProblem(null);
          setReady(true);
        },
        (why) => {
          setProblem(why);
          setReady(true);
        },
      ),
    [],
  );

  return { account, ready, problem };
}
