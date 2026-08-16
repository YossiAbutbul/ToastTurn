import { Wordmark } from './Wordmark';
import { en } from '../i18n/en';
import { prettyTime } from '../lib/format';
import type { Schedule } from '../lib/types';

type TopBarProps = {
  schedule: Schedule;
  /** Left out on a phone that joined by link: the night is the owner's to set. */
  onSchedule?: () => void;
  onHistory: () => void;
  onSettings: () => void;
  /** The wordmark goes back to the welcome, without giving up the rotation. */
  onHome: () => void;
};

export function TopBar({ schedule, onSchedule, onHistory, onSettings, onHome }: TopBarProps) {
  return (
    <div className="bar">
      <Wordmark onClick={onHome} />
      <div className="spacer" />
      {onSchedule ? (
        <button className="pill" type="button" onClick={onSchedule}>
          {en.days[schedule.weekday]} · {prettyTime(schedule.time)}
        </button>
      ) : (
        <span className="pill flat">
          {en.days[schedule.weekday]} · {prettyTime(schedule.time)}
        </span>
      )}
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
    </div>
  );
}
