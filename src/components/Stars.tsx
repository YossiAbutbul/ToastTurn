import { en } from '../i18n/en';
import { formatAverage } from '../lib/ratings';
import type { Verdict } from '../lib/ratings';
import './Stars.css';

type StarsProps = {
  /** The score the stars are filled to. */
  verdict: Verdict;
  /** What this account said, when these stars are the ones you set. */
  mine?: number;
  label: string;
  onRate?: (rating: number) => void;
  /** Text shown when there is no score yet. */
  emptyText?: string;
};

/**
 * Five stars. With onRate they are yours to set; without, they are a read-out
 * of what other people thought.
 */
export function Stars({ verdict, mine, label, onRate, emptyText }: StarsProps) {
  const shown = mine ?? (verdict ? Math.round(verdict.average) : 0);

  return (
    <span className="stars-row">
      <span className="stars-buttons" role="group" aria-label={label}>
        {[1, 2, 3, 4, 5].map((value) =>
          onRate ? (
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
          ) : (
            <span key={value} className={value <= shown ? 'star on' : 'star'} aria-hidden="true">
              ★
            </span>
          ),
        )}
      </span>
      {verdict ? (
        <span className="stars-score">
          {formatAverage(verdict.average)}
          {verdict.votes > 1 ? ` · ${verdict.votes}` : ''}
        </span>
      ) : (
        <span className="stars-score quiet">{emptyText ?? en.history.notRated}</span>
      )}
    </span>
  );
}
