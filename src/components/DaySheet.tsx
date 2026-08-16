import { Sheet } from './Sheet';
import { Stars } from './Stars';
import { en } from '../i18n/en';
import { initialOf } from '../lib/format';
import { myRating, othersVerdict } from '../lib/ratings';
import { getPerson } from '../lib/rotation';
import type { Family, Turn } from '../lib/types';
import './DaySheet.css';

type DaySheetProps = {
  open: boolean;
  family: Family;
  /** The day tapped in the calendar, and what was logged on it. */
  date: Date | null;
  turns: Turn[];
  uid?: string;
  onClose: () => void;
  onRate: (turnId: string, rating: number) => void;
};

const LONG_DATE = new Intl.DateTimeFormat('en', { weekday: 'long', day: 'numeric', month: 'long' });

/** One day from the calendar: who made it, what the family thought, your say. */
export function DaySheet({ open, family, date, turns, uid, onClose, onRate }: DaySheetProps) {
  const title = date ? LONG_DATE.format(date) : en.history.title;

  return (
    <Sheet open={open} title={title} onClose={onClose} onTop>
      {turns.length === 0 && <p className="empty">{en.day.nothing}</p>}

      {turns.map((turn) => {
        const person = getPerson(family, turn.personId);
        const name = person?.name ?? '?';
        const mine = myRating(turn, uid);

        return (
          <div className="day-entry" key={turn.id}>
            <div className="day-who">
              <span className="mini" style={{ background: person?.color }}>
                {initialOf(name)}
              </span>
              <b>{turn.skipped ? en.day.nobody : name}</b>
            </div>

            {turn.skipped ? (
              <p className="empty">{en.day.skipped}</p>
            ) : (
              <>
                <div className="fieldlabel spaced">{en.day.yours}</div>
                {/* your own block shows your own score, not the family's -
                    borrowing the average made it look like you had rated */}
                <Stars
                  verdict={mine ? { average: mine, votes: 1 } : null}
                  mine={mine}
                  label={en.history.rate(name)}
                  onRate={(rating) => onRate(turn.id, rating)}
                  emptyText={en.day.yoursEmpty}
                />

                <div className="fieldlabel spaced">{en.day.others}</div>
                <Stars
                  verdict={othersVerdict(turn, uid)}
                  label={en.day.othersLabel(name)}
                  emptyText={en.day.othersEmpty}
                />
              </>
            )}
          </div>
        );
      })}
    </Sheet>
  );
}
