import { en } from '../i18n/en';
import { BREADS, TOPPINGS } from '../lib/orders';
import type { Bread, Slice, Topping } from '../lib/orders';

type SliceEditorProps = {
  slice: Slice;
  /** Somebody else's order: it can be read, not rewritten. */
  readOnly?: boolean;
  onBread: (bread: Bread) => void;
  onToggle: (topping: Topping) => void;
};

/**
 * One slice, from the bottom up: what it is made on, then everything that
 * could go on top of it. The bread comes first because it decides whether the
 * thing goes in the toaster at all.
 */
export function SliceEditor({ slice, readOnly, onBread, onToggle }: SliceEditorProps) {
  return (
    <>
      <div className="fieldlabel">{en.orders.bread}</div>
      <div className="breads" role="group" aria-label={en.orders.bread}>
        {BREADS.map((bread: Bread) => {
          const on = bread === slice.bread;
          return (
            <button
              key={bread}
              type="button"
              className={on ? 'bread-btn on' : 'bread-btn'}
              aria-pressed={on}
              aria-label={en.orders.breadFor(en.orders.breads[bread])}
              disabled={readOnly}
              onClick={() => onBread(bread)}
            >
              {en.orders.breads[bread]}
            </button>
          );
        })}
      </div>

      <div className="fieldlabel spaced">{en.orders.onTop}</div>
      {TOPPINGS.map((topping: Topping) => {
        const on = slice.toppings.includes(topping);
        return (
          <div className={readOnly ? 'row hushed' : 'row'} key={topping}>
            <span className={`mini chip-${topping}`} aria-hidden="true" />
            <b>{en.orders.toppings[topping]}</b>
            <button
              type="button"
              className={on ? 'tog on' : 'tog'}
              role="switch"
              aria-checked={on}
              aria-label={en.orders.toppings[topping]}
              disabled={readOnly}
              onClick={() => onToggle(topping)}
            >
              <i />
            </button>
          </div>
        );
      })}
    </>
  );
}
