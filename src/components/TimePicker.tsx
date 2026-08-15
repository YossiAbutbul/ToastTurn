import { en } from '../i18n/en';
import './TimePicker.css';

type TimePickerProps = {
  /** "HH:MM", 24 hour. */
  value: string;
  onChange: (time: string) => void;
};

const STEP = 15;

function parse(value: string): { hour: number; minute: number } {
  const [hour, minute] = value.split(':').map(Number);
  return { hour: Number.isFinite(hour) ? hour : 20, minute: Number.isFinite(minute) ? minute : 0 };
}

function format(hour: number, minute: number): string {
  return `${String((hour + 24) % 24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

/**
 * The toast night's time in the app's own hand: one row, full width, no native
 * picker sliding up over everything. Chevrons either side of each number, and
 * the half of the day as a single button that flips.
 */
export function TimePicker({ value, onChange }: TimePickerProps) {
  const { hour, minute } = parse(value);
  const shownHour = hour % 12 === 0 ? 12 : hour % 12;
  const evening = hour >= 12;

  const nudgeHour = (by: number) => onChange(format((hour + by + 24) % 24, minute));
  const nudgeMinute = (by: number) => {
    const total = hour * 60 + minute + by * STEP;
    const wrapped = (total + 24 * 60) % (24 * 60);
    onChange(format(Math.floor(wrapped / 60), wrapped % 60));
  };

  return (
    <div className="clock">
      <div className="clock-dial">
        <button type="button" className="clock-step" aria-label={en.schedule.hourDown} onClick={() => nudgeHour(-1)}>
          ‹
        </button>
        <span className="clock-number">{shownHour}</span>
        <button type="button" className="clock-step" aria-label={en.schedule.hourUp} onClick={() => nudgeHour(1)}>
          ›
        </button>
      </div>

      <div className="clock-dial">
        <button
          type="button"
          className="clock-step"
          aria-label={en.schedule.minuteDown}
          onClick={() => nudgeMinute(-1)}
        >
          ‹
        </button>
        <span className="clock-number">{String(minute).padStart(2, '0')}</span>
        <button type="button" className="clock-step" aria-label={en.schedule.minuteUp} onClick={() => nudgeMinute(1)}>
          ›
        </button>
      </div>

      <button
        type="button"
        className="clock-half"
        aria-label={en.schedule.flipHalf}
        onClick={() => nudgeHour(evening ? -12 : 12)}
      >
        {evening ? en.schedule.pm : en.schedule.am}
      </button>
    </div>
  );
}
