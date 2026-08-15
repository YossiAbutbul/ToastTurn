import { en } from '../i18n/en';
import { initialOf, prettyTime } from '../lib/format';
import type { Person, Schedule } from '../lib/types';

type TopBarProps = {
  schedule: Schedule;
  /** Left out on a phone that joined by link: the night is the owner's to set. */
  onSchedule?: () => void;
  onHistory: () => void;
  onSettings: () => void;
  /** Who this phone is, shown as the way into settings. */
  me: Person | null;
  myColor?: string;
};

export function TopBar({ schedule, onSchedule, onHistory, onSettings, me, myColor }: TopBarProps) {
  return (
    <div className="bar">
      <div className="mark">
        {en.brand.first}
        <span>{en.brand.second}</span>
      </div>
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
      {/* Your own toast is the way into settings — it is also the reminder of
          who this phone is. */}
      <button
        className="avatar"
        type="button"
        onClick={onSettings}
        aria-label={en.settings.open}
        style={myColor ? { background: myColor } : undefined}
      >
        {me ? initialOf(me.name) : '···'}
      </button>
    </div>
  );
}
