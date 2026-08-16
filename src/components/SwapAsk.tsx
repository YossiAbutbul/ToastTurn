import { Confirm } from './Confirm';
import { en } from '../i18n/en';
import { formatDayDate } from '../lib/format';
import type { SwapRequest } from '../lib/swaps';
import type { Family } from '../lib/types';

type SwapAskProps = {
  /** The ask waiting on this phone, if there is one. */
  swap: SwapRequest | null;
  family: Family;
  onAccept: (swap: SwapRequest) => void;
  onDecline: (swap: SwapRequest) => void;
};

/** Somebody has asked you to take their turn: the date, and two answers. */
export function SwapAsk({ swap, family, onAccept, onDecline }: SwapAskProps) {
  if (!swap) return null;

  const from = family.people.find((person) => person.id === swap.fromPersonId);
  const when = new Date(swap.date);

  return (
    <Confirm
      open
      title={en.swap.askTitle(from?.name ?? '')}
      note={en.swap.askNote(formatDayDate(Number.isNaN(when.getTime()) ? new Date() : when))}
      confirmLabel={en.swap.accept}
      cancelLabel={en.swap.decline}
      onConfirm={() => onAccept(swap)}
      onCancel={() => onDecline(swap)}
    />
  );
}
