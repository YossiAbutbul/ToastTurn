import { initialOf } from '../lib/format';
import type { Person } from '../lib/types';
import './QueueBar.css';

type QueueBarProps = {
  /** The whole rotation, in order, whoever is up first. */
  people: Person[];
  /** Tapping anyone in the queue opens what they want. Left out for guests. */
  onPick?: (personId: string) => void;
  openLabel: (name: string) => string;
  nowLabel: (name: string) => string;
  /** How many slices each person still has coming, by person id. */
  slices: Record<string, number>;
  orderLabel: (name: string, slices: number) => string;
};

/**
 * The rotation along the bottom: everyone, in order, the person who is up
 * standing proud of the line. Logging a turn moves the rotation on, so they
 * slide to the back of the queue on their own.
 */
export function QueueBar({
  people,
  onPick,
  openLabel,
  nowLabel,
  slices,
  orderLabel,
}: QueueBarProps) {
  return (
    <div className="queue">
      {people.map((person, index) => {
        const className = index === 0 ? 'qbtn now' : 'qbtn';
        const label = index === 0 ? nowLabel(person.name) : openLabel(person.name);
        const wanted = slices[person.id] ?? 0;

        const inside = (
          <>
            {/* Everyone keeps their own colour, up or not, being up is said
                with height and a heavier outline instead. */}
            <span className="qtoast" style={{ background: person.color }}>
              {initialOf(person.name)}
              {/* A badge says one thing and one thing only: how many slices
                  are still to make for this person. Asking for an order is the
                  button's job, and saying it twice read as clutter. */}
              {wanted > 0 && (
                <i className="qbadge" aria-label={orderLabel(person.name, wanted)}>
                  {wanted}
                </i>
              )}
            </span>
            <span className="qname">{person.name}</span>
          </>
        );

        return onPick ? (
          <button
            key={person.id}
            type="button"
            className={className}
            onClick={() => onPick(person.id)}
            aria-label={label}
          >
            {inside}
          </button>
        ) : (
          <div key={person.id} className={className} aria-label={label}>
            {inside}
          </div>
        );
      })}
    </div>
  );
}
