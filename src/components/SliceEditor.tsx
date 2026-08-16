import { en } from '../i18n/en';
import { TOPPINGS } from '../lib/orders';
import type { Slice, Topping } from '../lib/orders';

type SliceEditorProps = {
  slice: Slice;
  index: number;
  /** Hidden on the only slice: there has to be one. */
  onRemove?: () => void;
  onToggle: (topping: Topping) => void;
};

/** One slice of somebody's order, and everything that could go on it. */
export function SliceEditor({ slice, index, onRemove, onToggle }: SliceEditorProps) {
  return (
    <div className="slice">
      <div className="slice-head">
        <span className="slice-no">{en.orders.sliceNo(index + 1)}</span>
        {onRemove && (
          <button
            type="button"
            className="slice-drop"
            aria-label={en.orders.dropSlice(index + 1)}
            onClick={onRemove}
          >
            ×
          </button>
        )}
      </div>

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
    </div>
  );
}
