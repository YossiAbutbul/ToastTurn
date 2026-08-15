import { Sheet } from './Sheet';
import { MonthStats } from './MonthStats';
import { MonthCalendar } from './MonthCalendar';
import { Stars } from './Stars';
import { en } from '../i18n/en';
import { formatShortDate } from '../lib/format';
import { getPerson } from '../lib/rotation';
import { myRating, verdict } from '../lib/ratings';
import { now } from '../lib/clock';
import type { Family } from '../lib/types';

type HistorySheetProps = {
  open: boolean;
  family: Family;
  onClose: () => void;
  onPickDay: (date: Date) => void;
  covered?: boolean;
  onRate: (turnId: string, rating: number) => void;
  /** The account doing the rating, if anyone is signed in. */
  uid?: string;
};

export function HistorySheet({ open, family, onClose, onPickDay, onRate, uid, covered }: HistorySheetProps) {
  return (
    <Sheet open={open} title={en.history.title} onClose={onClose} fixedHeight covered={covered}>
      <MonthCalendar family={family} month={now()} onPickDay={onPickDay} />

      <div className="fieldlabel spaced">{en.history.thisMonth}</div>
      <MonthStats family={family} now={now()} />

      <div className="fieldlabel spaced">{en.history.everyTurn}</div>
      {family.turns.length === 0 && <p className="empty">{en.history.empty}</p>}

      {family.turns.map((turn) => {
        const who = getPerson(family, turn.personId)?.name ?? '—';
        return (
          <div className="turn-row" key={turn.id}>
            <div className="turn-head">
              <b>{turn.skipped ? en.day.nobody : who}</b>
              <span className="when">{formatShortDate(turn.madeAt)}</span>
            </div>
            {!turn.skipped && (
              <Stars
                verdict={verdict(turn)}
                mine={myRating(turn, uid)}
                label={en.history.rate(who)}
                onRate={(rating) => onRate(turn.id, rating)}
              />
            )}
          </div>
        );
      })}
    </Sheet>
  );
}
