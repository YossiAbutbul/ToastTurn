import { initialOf } from '../lib/format';
import { outstanding } from '../lib/orders';
import type { OrderLine } from '../lib/orders';
import { en } from '../i18n/en';

type WhoseOrderProps = {
  lines: OrderLine[];
  chosenId: string;
  /** Which of a person's slices are already made, so the count agrees with
      the one on the queue rather than counting work twice. */
  madeFor: (personId: string) => number[];
  onPick: (personId: string) => void;
};

/**
 * Whose order is being written, for a phone that may write more than one.
 *
 * The owner speaks for the people who have no phone of their own, so the
 * sheet has to ask which of them it is dealing with. Everyone else only ever
 * sees their own name, and never sees this at all.
 */
export function WhoseOrder({ lines, chosenId, madeFor, onPick }: WhoseOrderProps) {
  return (
    <div className="whose" role="group" aria-label={en.orders.whose}>
      {lines.map(({ person, order }) => {
        const left = outstanding(order, madeFor(person.id));
        return (
          <button
            key={person.id}
            type="button"
            className={person.id === chosenId ? 'whose-btn on' : 'whose-btn'}
            aria-pressed={person.id === chosenId}
            onClick={() => onPick(person.id)}
          >
            <span className="whose-toast" style={{ background: person.color }}>
              {initialOf(person.name)}
              {left > 0 && <i className="whose-count">{left}</i>}
            </span>
            <span className="whose-name">{person.name}</span>
          </button>
        );
      })}
    </div>
  );
}
