import { useState } from 'react';
import { Sheet } from './Sheet';
import { SliceEditor } from './SliceEditor';
import { WhoseOrder } from './WhoseOrder';
import { en } from '../i18n/en';
import { NOTE_MAX, SLICE_MAX, TOPPINGS, cleanNote } from '../lib/orders';
import type { Order, OrderLine, Slice, Topping } from '../lib/orders';
import type { Person } from '../lib/types';
import './OrdersSheet.css';

type Choice = Omit<Order, 'personId' | 'updatedAt'>;

type OrdersSheetProps = {
  open: boolean;
  onClose: () => void;
  lines: OrderLine[];
  /** Which of a person's slices are already made, and ticking one off. */
  madeFor: (personId: string) => number[];
  onTick: (personId: string, index: number) => void;
  /** Which person this phone is, if it is anybody. */
  me: Person | null;
  /** Whose order this phone may write: your own, and everyone's if you run it. */
  canOrderFor: (personId: string) => boolean;
  onSet: (personId: string, choice: Choice) => void;
  /** Take the whole order off: somebody wants nothing today. */
  onClear: (personId: string) => void;
  /** Whose order to open on. Unset means yours, which is the usual way in. */
  focus?: string;
  covered?: boolean;
};

const ONE_PLAIN: Slice[] = [{ toppings: [] }];

/** What everyone wants: yours at the top, the whole list underneath. */
export function OrdersSheet({
  open,
  onClose,
  lines,
  madeFor,
  onTick,
  me,
  canOrderFor,
  onSet,
  onClear,
  focus,
  covered,
}: OrdersSheetProps) {
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
          toppings: on
            ? slice.toppings.filter((t) => t !== topping)
            : TOPPINGS.filter((t) => t === topping || slice.toppings.includes(t)),
        };
      }),
    );

  const done = chosen?.order ? madeFor(chosen.person.id).includes(active) : false;

  return (
    <Sheet
      open={open}
      title={en.orders.title}
      onClose={onClose}
      covered={covered}
      action={
        chosen?.order && (
          <button
            type="button"
            className={done ? 'sheet-action made' : 'sheet-action'}
            aria-pressed={done}
            onClick={() => onTick(chosen.person.id, active)}
          >
            {/* The button says where the slice stands, and pressing it moves
                it: aria-pressed carries the same thing to a screen reader. */}
            {done
              ? en.orders.done(en.orders.sliceNo(active + 1))
              : en.orders.notDoneYet(en.orders.sliceNo(active + 1))}
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
              madeFor={madeFor}
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
                onClick={() => save([{ toppings: [] }])}
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
                  save([...slices, { toppings: [] }]);
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

    </Sheet>
  );
}
