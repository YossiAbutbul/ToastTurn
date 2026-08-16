import { useState } from 'react';
import { Sheet } from './Sheet';
import { OrderRow } from './OrderRow';
import { SliceEditor } from './SliceEditor';
import { en } from '../i18n/en';
import { NOTE_MAX, SLICE_MAX, TOPPINGS, cleanNote } from '../lib/orders';
import type { Order, OrderLine, OrderTally, Slice, Topping } from '../lib/orders';
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

const ONE_PLAIN: Slice[] = [{ toppings: [] }];

/** What everyone wants: yours at the top, the whole list underneath. */
export function OrdersSheet({ open, onClose, lines, tally, me, mine, onSet, covered }: OrdersSheetProps) {
  const [note, setNote] = useState(mine?.note ?? '');
  const slices = mine?.slices ?? ONE_PLAIN;

  const save = (nextSlices: Slice[], nextNote = note) => {
    if (!me) return;
    const tidied = cleanNote(nextNote);
    const choice: Choice = { slices: nextSlices };
    onSet(me.id, tidied ? { ...choice, note: tidied } : choice);
  };

  // Toppings keep the order of the list rather than the order they were
  // tapped, so two people asking for the same thing read the same.
  const toggle = (index: number, topping: Topping) =>
    save(
      slices.map((slice, i) => {
        if (i !== index) return slice;
        const on = slice.toppings.includes(topping);
        return {
          toppings: on
            ? slice.toppings.filter((t) => t !== topping)
            : TOPPINGS.filter((t) => t === topping || slice.toppings.includes(t)),
        };
      }),
    );

  // What to get out of the fridge, for whoever is making it.
  // "Cheese for 2" rather than "2 cheese": the count belongs to the slices,
  // not to the thing, and it saves pluralising six nouns.
  const fridge = TOPPINGS.filter((topping) => tally.toppings[topping] > 0).map(
    (topping) => `${en.orders.toppings[topping]} for ${tally.toppings[topping]}`,
  );

  return (
    <Sheet open={open} title={en.orders.title} onClose={onClose} covered={covered}>
      {me && (
        <>
          <div className="fieldlabel">{en.orders.yours}</div>

          {slices.map((slice, index) => (
            <SliceEditor
              key={index}
              slice={slice}
              index={index}
              onRemove={slices.length > 1 ? () => save(slices.filter((_, i) => i !== index)) : undefined}
              onToggle={(topping) => toggle(index, topping)}
            />
          ))}

          {slices.length < SLICE_MAX && (
            <button
              type="button"
              className="ghost add-slice"
              onClick={() => save([...slices, { toppings: [] }])}
            >
              {en.orders.addSlice}
            </button>
          )}

          <input
            type="text"
            aria-label={en.orders.noteLabel}
            placeholder={en.orders.notePlaceholder}
            maxLength={NOTE_MAX}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={() => save(slices)}
            onKeyDown={(e) => e.key === 'Enter' && save(slices)}
          />
        </>
      )}

      <div className={me ? 'fieldlabel spaced' : 'fieldlabel'}>{en.orders.everyone}</div>
      <p className="empty">{en.orders.said(tally.said, tally.people, tally.slices)}</p>
      {fridge.length > 0 && <p className="fridge">{en.orders.fridge(fridge)}</p>}

      {lines.map((line) => (
        <OrderRow key={line.person.id} line={line} />
      ))}
    </Sheet>
  );
}
