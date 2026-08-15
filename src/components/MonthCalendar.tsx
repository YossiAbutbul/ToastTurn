import { en } from '../i18n/en';
import { initialOf } from '../lib/format';
import { monthCalendar } from '../lib/calendar';
import { getPerson } from '../lib/rotation';
import type { Family } from '../lib/types';
import './MonthCalendar.css';

const MONTH = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' });

/** Who made toast on which day, a month at a time. */
type MonthCalendarProps = {
  family: Family;
  month: Date;
  onPickDay: (date: Date) => void;
};

export function MonthCalendar({ family, month, onPickDay }: MonthCalendarProps) {
  const weeks = monthCalendar(month, family.turns);
  const today = new Date();
  const isThisMonth =
    today.getMonth() === month.getMonth() && today.getFullYear() === month.getFullYear();

  return (
    <div className="calendar">
      <div className="calendar-month">{MONTH.format(month)}</div>

      <div className="calendar-grid">
        {en.days.map((day) => (
          <div className="calendar-head" key={day}>
            {day[0]}
          </div>
        ))}

        {weeks.flat().map((cell, i) => {
          const turn = cell.turns[0];
          const person = turn ? getPerson(family, turn.personId) : undefined;
          const isToday = isThisMonth && cell.day === today.getDate();

          if (cell.day === null) return <span className="calendar-day empty-day" key={i} />;

          return (
            <button
              type="button"
              className={isToday ? 'calendar-day today' : 'calendar-day'}
              key={i}
              onClick={() => onPickDay(new Date(month.getFullYear(), month.getMonth(), cell.day!))}
            >
              <span className="calendar-date">{cell.day}</span>
              {turn &&
                (turn.skipped ? (
                  <span className="calendar-skip" title={en.history.skippedRow}>
                    –
                  </span>
                ) : (
                  <span
                    className="calendar-toast"
                    style={{ background: person?.color }}
                    title={person?.name}
                  >
                    {person ? initialOf(person.name) : '?'}
                  </span>
                ))}
            </button>
          );
        })}
      </div>
    </div>
  );
}
