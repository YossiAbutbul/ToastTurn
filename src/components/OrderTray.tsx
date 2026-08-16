import { SliceDots } from './SliceDots';
import { en } from '../i18n/en';
import type { OrderLine } from '../lib/orders';
import './OrderTray.css';

type OrderTrayProps = {
  lines: OrderLine[];
  /** True when this phone is the one making it: the tray is then a to-do. */
  making: boolean;
  /** False until this phone has said what it wants. */
  ordered: boolean;
  onOpen: () => void;
};

/** How many slices fit across a phone before the tray starts counting instead. */
const SHOWN = 5;

/**
 * The orders, on the main screen, as the slices themselves.
 *
 * Whoever is making the toast should not have to go looking for what to put
 * on it, and a number in a link does not tell them anything. Each slice is
 * drawn in the colour of the person who asked for it, carrying the marks of
 * what goes on top.
 */
export function OrderTray({ lines, making, ordered, onOpen }: OrderTrayProps) {
  const slices = lines.flatMap((line) =>
    (line.order?.slices ?? []).map((slice) => ({ person: line.person, slice })),
  );

  // Until you have said, the tray asks. After that it reports: what you are
  // making if it is your turn, or what the others have asked for if it is not.
  const label = !ordered
    ? en.orders.orderNow
    : slices.length === 0
      ? en.orders.trayEmpty
      : making
        ? en.orders.trayYours(slices.length)
        : en.orders.trayOthers(slices.length);

  return (
    <button className={ordered ? 'tray' : 'tray asking'} type="button" onClick={onOpen}>
      <span className="tray-label">{label}</span>

      {slices.length > 0 && (
        <span className="tray-slices">
          {slices.slice(0, SHOWN).map(({ person, slice }, i) => (
            <span className="tray-slice" style={{ background: person.color }} key={i}>
              <SliceDots toppings={slice.toppings} />
            </span>
          ))}
          {slices.length > SHOWN && <span className="tray-more">+{slices.length - SHOWN}</span>}
        </span>
      )}
    </button>
  );
}
