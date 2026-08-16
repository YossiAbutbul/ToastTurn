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
            {en.orders.toastiness[order.toastiness]}
            {order.toppings.length > 0
              ? `, ${order.toppings.map((topping) => en.orders.toppings[topping].toLowerCase()).join(', ')}`
              : en.orders.plain}
            {order.note ? ` · ${order.note}` : ''}
          </span>
        ) : (
          <span className="order-line quiet">{en.orders.nothingYet}</span>
        )}
      </div>
    </div>
  );
}
