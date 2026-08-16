import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import './Confirm.css';

type ConfirmProps = {
  open: boolean;
  /** What is about to happen, with whoever it happens to named. */
  title: string;
  note?: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Asking before something that cannot be undone, in the app's own hand.
 *
 * It goes through a portal to the body rather than sitting in whatever opened
 * it: a sheet is moved with a transform, and a transformed ancestor makes a
 * fixed child position against the sheet instead of the screen.
 */
export function Confirm(props: ConfirmProps) {
  const { open, onCancel } = props;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return createPortal(
    <div className="confirm-scrim" onClick={onCancel}>
      <div
        className="confirm-card"
        role="dialog"
        aria-modal="true"
        aria-label={props.title}
        onClick={(e) => e.stopPropagation()}
      >
        <b>{props.title}</b>
        {props.note && <p>{props.note}</p>}

        <div className="confirm-row">
          <button className="ghost" type="button" onClick={onCancel}>
            {props.cancelLabel}
          </button>
          <button className="ghost primary" type="button" onClick={props.onConfirm}>
            {props.confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
