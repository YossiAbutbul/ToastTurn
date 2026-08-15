import './Stars.css';

type StarsProps = {
  /** 0 when nobody has said yet. */
  rating: number;
  label: string;
  onRate: (rating: number) => void;
};

/** Five taps' worth of opinion about a piece of toast. Anyone can set it. */
export function Stars({ rating, label, onRate }: StarsProps) {
  return (
    <span className="stars-row" role="group" aria-label={label}>
      {[1, 2, 3, 4, 5].map((value) => (
        <button
          key={value}
          type="button"
          className={value <= rating ? 'star on' : 'star'}
          aria-label={`${value}`}
          aria-pressed={value === rating}
          onClick={() => onRate(value)}
        >
          ★
        </button>
      ))}
    </span>
  );
}
