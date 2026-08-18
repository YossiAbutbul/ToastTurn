import { Wordmark } from './Wordmark';
import { en } from '../i18n/en';
import { initialOf } from '../lib/format';
import type { Person } from '../lib/types';

type TopBarProps = {
  onHistory: () => void;
  onSettings: () => void;
  /** You, and the colour you go by. Separate from the rotation's own settings. */
  onProfile: () => void;
  /** Which person this phone is, if it is anybody yet. */
  me: Person | null;
  /** The wordmark goes back to the welcome, without giving up the rotation. */
  onHome: () => void;
};

export function TopBar({ onHistory, onSettings, onProfile, me, onHome }: TopBarProps) {
  return (
    <div className="bar">
      <Wordmark onClick={onHome} />
      <div className="spacer" />
      <button className="pill" type="button" onClick={onHistory}>
        {en.home.history}
      </button>
      <button className="avatar" type="button" onClick={onSettings} aria-label={en.settings.open}>
        {/* A cog, drawn the way the rest of the app is: one ring, one hub,
            eight stubby teeth. */}
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="5.2" />
          <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
          <path d="M18.4 12 H21 M16.5 16.5 L18.4 18.4 M12 18.4 V21 M7.5 16.5 L5.6 18.4 M5.6 12 H3 M7.5 7.5 L5.6 5.6 M12 5.6 V3 M16.5 7.5 L18.4 5.6" />
        </svg>
      </button>
      {/* You: a circle and a letter. The same button as the cog beside it -
          your colour belongs to your slice in the queue, and wearing it up
          here made the bar look like it was reporting something. */}
      <button
        className="avatar me"
        type="button"
        onClick={onProfile}
        aria-label={en.profile.open}
      >
        {me ? initialOf(me.name) : '?'}
      </button>

    </div>
  );
}
