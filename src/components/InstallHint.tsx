import { useState } from 'react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { dismissInstallHint, installHintDismissed } from '../lib/storage';
import { en } from '../i18n/en';
import './InstallHint.css';

/** Offered once. Dismissed is dismissed, it never comes back. */
export function InstallHint() {
  const { canPrompt, promptInstall, installed, ios } = useInstallPrompt();
  const [gone, setGone] = useState(installHintDismissed);

  if (gone || installed) return null;
  if (!canPrompt && !ios) return null;

  const close = () => {
    dismissInstallHint();
    setGone(true);
  };

  return (
    <div className="install-hint" role="note">
      <p>{ios ? en.install.ios : en.install.prompt}</p>
      {canPrompt && (
        <button
          type="button"
          className="install-add"
          onClick={() => {
            void promptInstall();
            close();
          }}
        >
          {en.install.add}
        </button>
      )}
      <button type="button" className="install-dismiss" aria-label={en.install.dismiss} onClick={close}>
        ×
      </button>
    </div>
  );
}
