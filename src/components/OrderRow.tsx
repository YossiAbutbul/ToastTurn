import { en } from '../i18n/en';
import { initialOf } from '../lib/format';
import type { OrderLine } from '../lib/orders';

/** One person's order, the way the maker wants to read it: name, then what. */
export function OrderRow({ line }: { line: OrderLine }) {
  const { person, order } = line;

  return (
    <div className="row order-row">
      <span className="mini" style={{ background: person.color }}>
        {initialOf(person.name)}
      </span>

      <div className="order-what">
        <b>{person.name}</b>
        {order ? (
          <span className="order-line">
            {order.slices.map((slice, i) => (
              <span className="order-slice" key={i}>
                {order.slices.length > 1 ? `${i + 1}. ` : ''}
                {slice.toppings.length > 0
                  ? slice.toppings.map((topping) => en.orders.toppings[topping].toLowerCase()).join(', ')
                  : en.orders.plainSlice}
              </span>
            ))}
            {order.note ? <span className="order-slice">{order.note}</span> : null}
          </span>
        ) : (
          <span className="order-line quiet">{en.orders.nothingYet}</span>
        )}
      </div>
    </div>
  );
}
