import { en } from '../i18n/en';
import { TOPPINGS } from '../lib/orders';
import type { Slice, Topping } from '../lib/orders';

type SliceEditorProps = {
  slice: Slice;
  onToggle: (topping: Topping) => void;
};

/** Everything that could go on the slice being looked at. */
export function SliceEditor({ slice, onToggle }: SliceEditorProps) {
  return (
    <div className="toppings" role="group" aria-label={en.orders.onTop}>
      {TOPPINGS.map((topping: Topping) => {
        const on = slice.toppings.includes(topping);
        return (
          <button
            key={topping}
            type="button"
            className={on ? 'topping on' : 'topping'}
            aria-pressed={on}
            onClick={() => onToggle(topping)}
          >
            {en.orders.toppings[topping]}
          </button>
        );
      })}
    </div>
  );
}
