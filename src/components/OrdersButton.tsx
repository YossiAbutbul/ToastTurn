import { en } from '../i18n/en';
import './OrdersButton.css';

type OrdersButtonProps = {
  /** Slices asked for across the whole rotation. */
  slices: number;
  /** True when this phone is the one making it: the list is then a to-do. */
  making: boolean;
  /** False until this phone has said what it wants. */
  ordered: boolean;
  onOpen: () => void;
};

/**
 * The way in to the orders.
 *
 * What everyone wants is written on the queue itself, so this does not repeat
 * it: it asks while you have not said, and afterwards it is simply the door
 * to the list.
 */
export function OrdersButton({ slices, making, ordered, onOpen }: OrdersButtonProps) {
  const label = !ordered
    ? en.orders.orderNow
    : making
      ? en.orders.trayYours(slices)
      : en.orders.open;

  return (
    <button className={ordered ? 'orders-btn' : 'orders-btn asking'} type="button" onClick={onOpen}>
      {label}
    </button>
  );
}
