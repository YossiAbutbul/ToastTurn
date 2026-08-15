import { useEffect, useState } from 'react';
import { watchAccount } from '../lib/auth';
import type { Account } from '../lib/auth';

/** Who is signed in on this device, if anyone. */
export function useAccount(): { account: Account | null; ready: boolean } {
  const [account, setAccount] = useState<Account | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(
    () =>
      watchAccount((next) => {
        setAccount(next);
        setReady(true);
      }),
    [],
  );

  return { account, ready };
}
