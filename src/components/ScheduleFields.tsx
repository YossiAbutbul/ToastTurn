import { en } from '../i18n/en';
import type { Schedule } from '../lib/types';

type ScheduleFieldsProps = {
  schedule: Schedule;
  onChange: (patch: Partial<Schedule>) => void;
};

/** Toast night: which day, what time, whether to nudge people that morning. */
export function ScheduleFields({ schedule, onChange }: ScheduleFieldsProps) {
  return (
    <>
      <div className="fieldlabel">{en.schedule.day}</div>
      <div className="days">
        {en.days.map((day, index) => (
          <button
            key={day}
            type="button"
            className={index === schedule.weekday ? 'day sel' : 'day'}
            aria-pressed={index === schedule.weekday}
            aria-label={day}
            onClick={() => onChange({ weekday: index })}
          >
            {day[0]}
          </button>
        ))}
      </div>

      <div className="fieldlabel">{en.schedule.time}</div>
      <div className="timerow">
        <input
          type="time"
          value={schedule.time}
          aria-label={en.schedule.time}
          onChange={(e) => e.target.value && onChange({ time: e.target.value })}
        />
      </div>

      <div className="remind">
        {en.schedule.remind}
        <button
          type="button"
          className={schedule.remind ? 'tog on' : 'tog'}
          role="switch"
          aria-checked={schedule.remind}
          aria-label={en.schedule.remind}
          onClick={() => onChange({ remind: !schedule.remind })}
        >
          <i />
        </button>
      </div>
    </>
  );
}
