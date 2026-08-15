import { Sheet } from './Sheet';
import { MonthStats } from './MonthStats';
import { Stars } from './Stars';
import { en } from '../i18n/en';
import { formatShortDate } from '../lib/format';
import { getPerson } from '../lib/rotation';
import { now } from '../lib/clock';
import type { Family } from '../lib/types';

type HistorySheetProps = {
  open: boolean;
  family: Family;
  onClose: () => void;
  onSkip: () => void;
  onRate: (turnId: string, rating: number) => void;
};

export function HistorySheet({ open, family, onClose, onSkip, onRate }: HistorySheetProps) {
  return (
    <Sheet open={open} title={en.history.title} onClose={onClose} fixedHeight>
      <div className="fieldlabel">{en.history.thisMonth}</div>
      <MonthStats family={family} now={now()} />

      <div className="fieldlabel spaced">{en.history.everyTurn}</div>
      {family.turns.length === 0 && <p className="empty">{en.history.empty}</p>}

      {family.turns.map((turn) => {
        const who = getPerson(family, turn.personId)?.name ?? '—';
        return (
          <div className="row" key={turn.id}>
            <b>{who}</b>
            {turn.skipped ? (
              <span className="stars">{en.history.skipped}</span>
            ) : (
              <Stars
                rating={turn.rating ?? 0}
                label={en.history.rate(who)}
                onRate={(rating) => onRate(turn.id, rating)}
              />
            )}
            <span className="when">{formatShortDate(turn.madeAt)}</span>
          </div>
        );
      })}

      <button className="ghost" type="button" onClick={onSkip}>
        {en.history.logSkip}
      </button>
    </Sheet>
  );
}
