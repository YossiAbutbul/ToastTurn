import { useState } from 'react';
import { Sheet } from './Sheet';
import { Confirm } from './Confirm';
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
  /** Owner only: a turn logged by mistake can be taken back off the board. */
  isOwner: boolean;
  onRemove: (turnId: string) => void;
  /** Owner only: fill in a day everyone forgot to log at the time. */
  onLog: (personId: string) => void;
  /** Today, so a day still ahead cannot be filled in. */
  today: Date;
};

const LONG_DATE = new Intl.DateTimeFormat('en', { weekday: 'long', day: 'numeric', month: 'long' });

/** One day from the calendar: who made it, what the family thought, your say. */
export function DaySheet(props: DaySheetProps) {
  const { open, family, date, turns, uid, onClose, onRate, isOwner } = props;
  const title = date ? LONG_DATE.format(date) : en.history.title;

  // Asking happens in the sheet, in the app's own voice, rather than in the
  // browser's grey box with the family's rotation named in it.
  const [asking, setAsking] = useState<string | null>(null);

  // A day gone by with nothing on it is one the family forgot to log, and the
  // owner is the one who can say who made it after the fact.
  const day = date ? new Date(date) : null;
  day?.setHours(0, 0, 0, 0);
  const start = new Date(props.today);
  start.setHours(0, 0, 0, 0);
  const ahead = day !== null && day.getTime() > start.getTime();
  const fillIn = isOwner && turns.length === 0 && date !== null;
  const roster = [...family.people].filter((p) => p.active).sort((a, b) => a.order - b.order);

  return (
    <Sheet open={open} title={title} onClose={onClose} onTop>
      {turns.length === 0 && <p className="empty">{en.day.nothing}</p>}

      {fillIn && (ahead ? (
        <p className="empty">{en.day.notYet}</p>
      ) : (
        <>
          <div className="fieldlabel spaced">{en.day.fillIn}</div>
          {roster.map((person) => (
            <button
              key={person.id}
              type="button"
              className="pickbtn"
              onClick={() => props.onLog(person.id)}
            >
              <span className="mini" style={{ background: person.color }}>
                {initialOf(person.name)}
              </span>
              <b>{en.day.made(person.name)}</b>
            </button>
          ))}
        </>
      ))}

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

            {isOwner && (
              <>
                <button
                  className="ghost day-remove"
                  type="button"
                  onClick={() => setAsking(turn.id)}
                >
                  {en.day.remove}
                </button>

                <Confirm
                  open={asking === turn.id}
                  title={en.day.removeAsk(turn.skipped ? en.day.nobody.toLowerCase() : name)}
                  note={en.day.removeNote}
                  confirmLabel={en.day.removeYes}
                  cancelLabel={en.day.removeNo}
                  onCancel={() => setAsking(null)}
                  onConfirm={() => {
                    setAsking(null);
                    props.onRemove(turn.id);
                  }}
                />
              </>
            )}
          </div>
        );
      })}
    </Sheet>
  );
}
