import { en } from '../i18n/en';
import { TOPPINGS } from '../lib/orders';
import type { Slice, Topping } from '../lib/orders';

type SliceEditorProps = {
  slice: Slice;
  /** Somebody else's order: it can be read, not rewritten. */
  readOnly?: boolean;
  onToggle: (topping: Topping) => void;
};

/**
 * Everything that could go on the slice being looked at, as the same row the
 * rest of the app uses for a thing with a switch beside it.
 */
export function SliceEditor({ slice, readOnly, onToggle }: SliceEditorProps) {
  return (
    <>
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
