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
};

/**
 * The rotation along the bottom: everyone, in order, the person who is up
 * standing proud of the line. Logging a turn moves the rotation on, so they
 * slide to the back of the queue on their own.
 */
export function QueueBar({ people, onPick, swapLabel, nowLabel }: QueueBarProps) {
  return (
    <div className="queue">
      {people.map((person, index) => {
        const className = index === 0 ? 'qbtn now' : 'qbtn';
        const label = index === 0 ? nowLabel(person.name) : swapLabel(person.name);
        const inside = (
          <>
            <span className="qtoast" style={index === 0 ? undefined : { background: person.color }}>
              {initialOf(person.name)}
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
