import { Sheet } from './Sheet';
import { en } from '../i18n/en';
import { formatShortDate } from '../lib/format';
import { getPerson } from '../lib/rotation';
import type { Family } from '../lib/types';

type HistorySheetProps = {
  open: boolean;
  family: Family;
  onClose: () => void;
  onSkip: () => void;
};

export function HistorySheet({ open, family, onClose, onSkip }: HistorySheetProps) {
  return (
    <Sheet open={open} title={en.history.title} onClose={onClose}>
      {family.turns.length === 0 && <p className="empty">{en.history.empty}</p>}

      {family.turns.map((turn) => (
        <div className="row" key={turn.id}>
          <b>{getPerson(family, turn.personId)?.name ?? '—'}</b>
          <span className="stars">
            {turn.skipped
              ? en.history.skipped
              : turn.rating
                ? '★'.repeat(turn.rating)
                : en.history.notRated}
          </span>
          <span className="when">{formatShortDate(turn.madeAt)}</span>
        </div>
      ))}

      <button className="ghost" type="button" onClick={onSkip}>
        {en.history.logSkip}
      </button>
    </Sheet>
  );
}
