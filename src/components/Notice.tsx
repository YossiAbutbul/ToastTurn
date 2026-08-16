import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import './Confirm.css';

type NoticeProps = {
  open: boolean;
  /** What just happened, with whoever it happened to named. */
  title: string;
  note?: string;
  closeLabel: string;
  onClose: () => void;
};

/**
 * Telling you something, rather than asking. Same card as Confirm, one way
 * out of it, and it goes through the same portal for the same reason: a sheet
 * is moved with a transform, and a transformed ancestor makes a fixed child
 * position against the sheet instead of the screen.
 */
export function Notice({ open, title, note, closeLabel, onClose }: NoticeProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="confirm-scrim" onClick={onClose}>
      <div
        className="confirm-card"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <b>{title}</b>
        {note && <p>{note}</p>}

        <div className="confirm-row">
          <button className="ghost primary" type="button" onClick={onClose}>
            {closeLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
