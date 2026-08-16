import type { Topping } from '../lib/orders';

/**
 * What is on a slice, as the colours themselves.
 *
 * The same marks appear on the tab you are dressing and beside the name in
 * the family's list, so an order can be recognised without being read.
 */
export function SliceDots({ toppings }: { toppings: Topping[] }) {
  if (toppings.length === 0) return <span className="dots empty-dots" aria-hidden="true" />;

  return (
    <span className="dots" aria-hidden="true">
      {toppings.map((topping) => (
        <i className={`dot ${topping}`} key={topping} />
      ))}
    </span>
  );
}
