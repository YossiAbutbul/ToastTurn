import { useSwipeAway } from '../hooks/useSwipeAway';
import { en } from '../i18n/en';
import './UndoNote.css';

type UndoNoteProps = {
  /** What just came off the board, named. Null when there is nothing to undo. */
  what: string | null;
  onUndo: () => void;
  /** Slid away: the offer is over, without taking it. */
  onDismiss: () => void;
};

/**
 * The one step back from saying an order is made.
 *
 * Not the little card that flies up after a pull: that one is a cheer, it
 * clears itself in a second and a half and cannot be touched. This has to be
 * reachable, so it sits above the queue and waits.
 */
export function UndoNote({ what, onUndo, onDismiss }: UndoNoteProps) {
  const swipe = useSwipeAway(onDismiss);

  if (!what) return null;

  const gone = Math.min(Math.abs(swipe.offset) / 140, 1);

  return (
    <div
      className={swipe.dragging ? 'undo sliding' : 'undo'}
      role="status"
      style={swipe.offset ? { transform: `translateX(${swipe.offset}px)`, opacity: 1 - gone } : undefined}
      {...swipe.handlers}
    >
      <span className="undo-what">{en.orders.orderDoneNote2(what)}</span>
      <button
        type="button"
        className="undo-do"
        // A slide that ends on the button is still a slide.
        onClick={() => !swipe.slid.current && onUndo()}
      >
        {en.orders.undo}
      </button>
    </div>
  );
}
