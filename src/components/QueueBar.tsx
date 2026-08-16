import { initialOf } from '../lib/format';
import type { Person } from '../lib/types';
import './QueueBar.css';

type QueueBarProps = {
  /** The whole rotation, in order, whoever is up first. */
  people: Person[];
  /** Tapping anyone in the queue opens the swap sheet. Left out for guests. */
  onPick?: () => void;
  swapLabel: (name: string) => string;
  nowLabel: (name: string) => string;
  /** How many slices each person has asked for, by person id. */
  slices: Record<string, number>;
  /** You, when you have not said what you want: your toast asks. */
  askingId?: string;
  orderLabel: (name: string, slices: number) => string;
  askLabel: string;
};

/**
 * The rotation along the bottom: everyone, in order, the person who is up
 * standing proud of the line. Logging a turn moves the rotation on, so they
 * slide to the back of the queue on their own.
 */
export function QueueBar({
  people,
  onPick,
  swapLabel,
  nowLabel,
  slices,
  askingId,
  orderLabel,
  askLabel,
}: QueueBarProps) {
  return (
    <div className="queue">
      {people.map((person, index) => {
        const className = index === 0 ? 'qbtn now' : 'qbtn';
        const label = index === 0 ? nowLabel(person.name) : swapLabel(person.name);
        const wanted = slices[person.id] ?? 0;
        const asking = person.id === askingId && wanted === 0;

        const inside = (
          <>
            {/* Everyone keeps their own colour, up or not, being up is said
                with height and a heavier outline instead. */}
            <span className="qtoast" style={{ background: person.color }}>
              {initialOf(person.name)}
              {/* What they want rides on their own toast: a number for slices
                  asked for, and a + on yours until you have said. */}
              {wanted > 0 && (
                <i className="qbadge" aria-label={orderLabel(person.name, wanted)}>
                  {wanted}
                </i>
              )}
              {asking && (
                <i className="qbadge asking" aria-label={askLabel}>
                  +
                </i>
              )}
            </span>
            <span className="qname">{person.name}</span>
          </>
        );

        return onPick ? (
          <button key={person.id} type="button" className={className} onClick={onPick} aria-label={label}>
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
