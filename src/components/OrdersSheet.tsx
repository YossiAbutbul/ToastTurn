import { useState } from 'react';
import { Sheet } from './Sheet';
import { Confirm } from './Confirm';
import { SliceEditor } from './SliceEditor';
import { WhoseOrder } from './WhoseOrder';
import { en } from '../i18n/en';
import { NOTE_MAX, SLICE_MAX, TOPPINGS, cleanNote, plainSlice } from '../lib/orders';
import type { Bread, Order, OrderLine, Slice, Topping } from '../lib/orders';
import type { Person } from '../lib/types';
import './OrdersSheet.css';

type Choice = Omit<Order, 'personId' | 'updatedAt'>;

type OrdersSheetProps = {
  open: boolean;
  onClose: () => void;
  lines: OrderLine[];
  /** Which person this phone is, if it is anybody. */
  me: Person | null;
  /** Whose order this phone may write: your own, and everyone's if you run it. */
  canOrderFor: (personId: string) => boolean;
  onSet: (personId: string, choice: Choice) => void;
  /** Take the whole order off: somebody wants nothing today. */
  onClear: (personId: string) => void;
  /** Whether this phone may say an order is made. Anyone in the rotation can:
      the maker is whoever's turn it is, not whoever runs it. */
  canMarkDone: boolean;
  /** Wipe the board once breakfast is over. Only whoever runs the rotation. */
  onClearBoard: () => void;
  canClearBoard: boolean;
  /** Whose order to open on. Unset means yours, which is the usual way in. */
  focus?: string;
  covered?: boolean;
};

const ONE_PLAIN: Slice[] = [plainSlice()];

/** What everyone wants: yours at the top, the whole list underneath. */
export function OrdersSheet({
  open,
  onClose,
  lines,
  me,
  canOrderFor,
  onSet,
  onClear,
  canMarkDone,
  onClearBoard,
  canClearBoard,
  focus,
  covered,
}: OrdersSheetProps) {
  // Both asked over the sheet: each takes an order off, and an order taken
  // off by mistake is one nobody gets.
  const [clearing, setClearing] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  // Everyone, because whoever is making the toast has to read the lot. What
  // this phone may change is a separate question, asked per person below.
  const first = lines.find((line) => line.person.id === me?.id) ?? lines[0];
  // Coming in off the queue asks for one person in particular. The button
  // along the bottom asks for nobody, which means you.
  const wanted = (focus && lines.some((line) => line.person.id === focus) ? focus : undefined)
    ?? first?.person.id;

  const [who, setWho] = useState<string | undefined>(wanted);
  const [asked, setAsked] = useState<string | undefined>(wanted);
  const [tab, setTab] = useState(0);

  // A second tap on the queue, on somebody else, while the sheet is still up.
  if (asked !== wanted) {
    setAsked(wanted);
    setWho(wanted);
    setTab(0);
  }

  // Looking at somebody else lasts as long as the sheet is open. Closing it
  // puts it back to whoever it opens on, because that is what it is for nine
  // times in ten, and being shown a sibling's order on opening is a puzzle.
  if (!open && who !== wanted) setWho(wanted);

  const chosen = lines.find((line) => line.person.id === who) ?? first;
  const mine = chosen ? canOrderFor(chosen.person.id) : false;
  const slices = chosen?.order?.slices ?? ONE_PLAIN;
  // Taking a slice off can leave the tab pointing past the end of the list.
  const active = Math.min(tab, slices.length - 1);

  // The note belongs to whoever is being ordered for, so switching people
  // brings theirs rather than carrying the last one across.
  const [noted, setNoted] = useState({ id: chosen?.person.id, text: chosen?.order?.note ?? '' });
  if (noted.id !== chosen?.person.id) {
    setNoted({ id: chosen?.person.id, text: chosen?.order?.note ?? '' });
  }
  const note = noted.text;

  const save = (nextSlices: Slice[], nextNote = note) => {
    if (!chosen) return;
    const tidied = cleanNote(nextNote);
    const choice: Choice = { slices: nextSlices };
    onSet(chosen.person.id, tidied ? { ...choice, note: tidied } : choice);
  };

  // Toppings keep the order of the list rather than the order they were
  // tapped, so two people asking for the same thing read the same.
  const toggle = (index: number, topping: Topping) =>
    save(
      slices.map((slice, i) => {
        if (i !== index) return slice;
        const on = slice.toppings.includes(topping);
        return {
          bread: slice.bread,
          toppings: on
            ? slice.toppings.filter((t) => t !== topping)
            : TOPPINGS.filter((t) => t === topping || slice.toppings.includes(t)),
        };
      }),
    );

  /** Change what the slice is made on, leaving everything on top of it alone. */
  const setBread = (index: number, bread: Bread) =>
    save(slices.map((slice, i) => (i === index ? { ...slice, bread } : slice)));

  /** Anything at all on the board, which is what there is to clear. */
  const anyOrders = lines.some((line) => line.order);

  return (
    <Sheet
      open={open}
      title={en.orders.title}
      onClose={onClose}
      covered={covered}
      action={
        chosen?.order && canMarkDone && (
          // Made and handed over, all of it. Saying so is what takes the order
          // off the board, so it is asked about before it happens.
          <button type="button" className="sheet-action" onClick={() => setDone(chosen.person.id)}>
            {en.orders.orderDone}
          </button>
        )
      }
    >
      {chosen && (
        <>
          <div className="fieldlabel">
            {chosen.person.id === me?.id ? en.orders.yours : en.orders.theirs(chosen.person.name)}
          </div>

          {/* Only worth a switcher when there is somebody to switch to. */}
          {lines.length > 1 && (
            <WhoseOrder
              lines={lines}
              chosenId={chosen.person.id}
              onPick={(id) => {
                setWho(id);
                setTab(0);
              }}
            />
          )}

          {!chosen.order &&
            (mine ? (
              <button
                type="button"
                className="ghost primary start-order"
                onClick={() => save([plainSlice()])}
              >
                {chosen.person.id === me?.id
                  ? en.orders.startMine
                  : en.orders.startTheirs(chosen.person.name)}
              </button>
            ) : (
              <p className="empty">{en.orders.noneYet(chosen.person.name)}</p>
            ))}

          {chosen.order && (
            <>
          <div className="slice-tabs" role="tablist" aria-label={en.orders.yours}>
            {slices.map((_, index) => (
              // A tab and its own × are two controls, so they are two buttons
              // in a box dressed as one tab rather than one nested in another.
              <span className={index === active ? 'tab tab-box on' : 'tab tab-box'} key={index}>
                <button
                  type="button"
                  role="tab"
                  className="tab-pick"
                  aria-selected={index === active}
                  onClick={() => setTab(index)}
                >
                  {en.orders.sliceNo(index + 1)}
                </button>

                {/* On the last slice this takes the order off altogether:
                    without it there is no way to say you want nothing. */}
                {mine && (chosen.order || slices.length > 1) && (
                  <button
                    type="button"
                    className="tab-x"
                    aria-label={
                      slices.length > 1
                        ? en.orders.dropSlice(index + 1)
                        : en.orders.dropOrder(chosen.person.name)
                    }
                    onClick={() => {
                      if (slices.length > 1) {
                        save(slices.filter((_, i) => i !== index));
                        setTab(index > 0 ? index - 1 : 0);
                      } else {
                        onClear(chosen.person.id);
                        setTab(0);
                      }
                    }}
                  >
                    ×
                  </button>
                )}
              </span>
            ))}

            {mine && slices.length < SLICE_MAX && (
              <button
                type="button"
                className="tab add"
                aria-label={en.orders.addSlice}
                onClick={() => {
                  save([...slices, plainSlice()]);
                  setTab(slices.length);
                }}
              >
                +
              </button>
            )}
          </div>

          <SliceEditor
            slice={slices[active]}
            readOnly={!mine}
            onBread={(bread) => setBread(active, bread)}
            onToggle={(topping) => toggle(active, topping)}
          />

          <input
            type="text"
            className="note-input"
            readOnly={!mine}
            aria-label={en.orders.noteLabel}
            placeholder={en.orders.notePlaceholder}
            maxLength={NOTE_MAX}
            value={note}
            onChange={(e) => setNoted({ id: chosen.person.id, text: e.target.value })}
            onBlur={() => save(slices)}
            onKeyDown={(e) => e.key === 'Enter' && save(slices)}
          />
            </>
          )}
        </>
      )}

      {/* The end of breakfast, in one tap, for whoever runs the rotation. */}
      {anyOrders && canClearBoard && (
        <>
          <button type="button" className="ghost spaced" onClick={() => setClearing(true)}>
            {en.orders.clearBoard}
          </button>
        </>
      )}

      <Confirm
        open={done !== null}
        title={en.orders.orderDoneAsk(
          lines.find((line) => line.person.id === done)?.person.name ?? '',
        )}
        note={en.orders.orderDoneNote}
        confirmLabel={en.orders.orderDoneYes}
        cancelLabel={en.orders.orderDoneNo}
        onCancel={() => setDone(null)}
        onConfirm={() => {
          if (done) onClear(done);
          setDone(null);
          setTab(0);
        }}
      />

      <Confirm
        open={clearing}
        title={en.orders.clearBoardAsk}
        note={en.orders.clearBoardNote}
        confirmLabel={en.orders.clearBoardYes}
        cancelLabel={en.orders.clearBoardNo}
        onCancel={() => setClearing(false)}
        onConfirm={() => {
          setClearing(false);
          onClearBoard();
          setTab(0);
        }}
      />
    </Sheet>
  );
}
