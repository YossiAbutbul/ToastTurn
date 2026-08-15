import { en } from '../i18n/en';
import { formatAverage } from '../lib/ratings';
import type { Verdict } from '../lib/ratings';
import './Stars.css';

type StarsProps = {
  /** What the family made of it, or null when nobody has said. */
  verdict: Verdict;
  /** What this account said, if anything. */
  mine?: number;
  label: string;
  onRate: (rating: number) => void;
};

/**
 * Five stars per turn. They show your own rating once you have given one, and
 * the family's average until then; the number beside them is always everyone.
 */
export function Stars({ verdict, mine, label, onRate }: StarsProps) {
  const shown = mine ?? (verdict ? Math.round(verdict.average) : 0);

  return (
    <span className="stars-row">
      <span className="stars-buttons" role="group" aria-label={label}>
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            className={value <= shown ? (mine ? 'star on mine' : 'star on') : 'star'}
            aria-label={`${value}`}
            aria-pressed={value === mine}
            onClick={() => onRate(value)}
          >
            ★
          </button>
        ))}
      </span>
      {verdict ? (
        <span className="stars-score">
          {formatAverage(verdict.average)} · {verdict.votes}
        </span>
      ) : (
        <span className="stars-score quiet">{en.history.notRated}</span>
      )}
    </span>
  );
}
