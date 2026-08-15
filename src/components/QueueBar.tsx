import { initialOf } from '../lib/format';
import type { Person } from '../lib/types';
import './QueueBar.css';

type QueueBarProps = {
  people: Person[];
  /** Tapping anyone in the queue opens the swap sheet. Left out for guests. */
  onPick?: () => void;
  swapLabel: (name: string) => string;
};

export function QueueBar({ people, onPick, swapLabel }: QueueBarProps) {
  return (
    <div className="queue">
      {people.map((person, index) =>
        onPick ? (
          <button
            key={person.id}
            type="button"
            className={index === 0 ? 'qbtn next' : 'qbtn'}
            onClick={onPick}
            aria-label={swapLabel(person.name)}
          >
            <span className="qtoast">{initialOf(person.name)}</span>
            <span className="qname">{person.name}</span>
          </button>
        ) : (
          <div key={person.id} className={index === 0 ? 'qbtn next' : 'qbtn'}>
            <span className="qtoast">{initialOf(person.name)}</span>
            <span className="qname">{person.name}</span>
          </div>
        ),
      )}
    </div>
  );
}
