import { useState } from 'react';
import { Sheet } from './Sheet';
import { OrderRow } from './OrderRow';
import { en } from '../i18n/en';
import { NOTE_MAX, TOASTINESS, TOPPINGS, cleanNote } from '../lib/orders';
import type { Order, OrderLine, OrderTally, Toastiness, Topping } from '../lib/orders';
import type { Person } from '../lib/types';
import './OrdersSheet.css';

type Choice = Omit<Order, 'personId' | 'updatedAt'>;

type OrdersSheetProps = {
  open: boolean;
  onClose: () => void;
  lines: OrderLine[];
  tally: OrderTally;
  /** Which person this phone is, if it is anybody. */
  me: Person | null;
  mine: Order | null;
  onSet: (personId: string, choice: Choice) => void;
  covered?: boolean;
};

/** What everyone wants: yours at the top, the whole list underneath. */
export function OrdersSheet({ open, onClose, lines, tally, me, mine, onSet, covered }: OrdersSheetProps) {
  const [note, setNote] = useState(mine?.note ?? '');
  const toastiness = mine?.toastiness ?? 'medium';
  const toppings = mine?.toppings ?? [];

  const save = (over: Partial<Choice>) => {
    if (!me) return;
    const tidied = cleanNote(note);
    const next: Choice = { toastiness, toppings, ...over };
    onSet(me.id, tidied ? { ...next, note: tidied } : next);
  };

  // What to get out of the fridge, for whoever is making it.
  // "Cheese for 2" rather than "2 cheese": the count belongs to the people,
  // not to the thing, and it saves pluralising six nouns.
  const fridge = TOPPINGS.filter((topping) => tally.toppings[topping] > 0).map(
    (topping) => `${en.orders.toppings[topping]} for ${tally.toppings[topping]}`,
  );

  return (
    <Sheet open={open} title={en.orders.title} onClose={onClose} covered={covered}>
      {me && (
        <>
          <div className="fieldlabel">{en.orders.yours}</div>

          <div className="doneness" role="group" aria-label={en.orders.howToasted}>
            {TOASTINESS.map((level: Toastiness) => (
              <button
                key={level}
                type="button"
                className={level === toastiness ? 'chip on' : 'chip'}
                aria-pressed={level === toastiness}
                onClick={() => save({ toastiness: level })}
              >
                <span className={`chip-slice ${level}`} aria-hidden="true" />
                {en.orders.toastiness[level]}
              </button>
            ))}
          </div>

          <div className="fieldlabel">{en.orders.onTop}</div>
          <div className="toppings" role="group" aria-label={en.orders.onTop}>
            {TOPPINGS.map((topping: Topping) => {
              const on = toppings.includes(topping);
              return (
                <button
                  key={topping}
                  type="button"
                  className={on ? 'topping on' : 'topping'}
                  aria-pressed={on}
                  onClick={() =>
                    save({
                      toppings: on
                        ? toppings.filter((t) => t !== topping)
                        : TOPPINGS.filter((t) => t === topping || toppings.includes(t)),
                    })
                  }
                >
                  {en.orders.toppings[topping]}
                </button>
              );
            })}
          </div>

          <input
            type="text"
            aria-label={en.orders.noteLabel}
            placeholder={en.orders.notePlaceholder}
            maxLength={NOTE_MAX}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={() => save({})}
            onKeyDown={(e) => e.key === 'Enter' && save({})}
          />
        </>
      )}

      <div className={me ? 'fieldlabel spaced' : 'fieldlabel'}>{en.orders.everyone}</div>
      <p className="empty">{en.orders.said(tally.said, tally.people)}</p>
      {fridge.length > 0 && <p className="fridge">{en.orders.fridge(fridge)}</p>}

      {lines.map((line) => (
        <OrderRow key={line.person.id} line={line} />
      ))}
    </Sheet>
  );
}
