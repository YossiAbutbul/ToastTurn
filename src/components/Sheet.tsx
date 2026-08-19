import { useEffect } from 'react';
import { useSheetDrag } from '../hooks/useSheetDrag';
import type { ReactNode } from 'react';
import { en } from '../i18n/en';
import './Sheet.css';

type SheetProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  /** Hold one height whatever the content does, and scroll inside. */
  fixedHeight?: boolean;
  /** Sits over another sheet rather than over the screen. */
  onTop?: boolean;
  /** Something opened over this one: soften it and take it out of reach. */
  covered?: boolean;
  /** One button that stays put at the bottom, above Close. */
  action?: ReactNode;
  /**
   * A control beside the title. For what changes the whole sheet rather than
   * one row in it - a pen that turns a list into a list you can rearrange -
   * so it does not scroll away with the rows it acts on.
   */
  headerAction?: ReactNode;
  children: ReactNode;
};

/** The bottom sheet everything that isn't the answer lives behind. */
export function Sheet({
  open,
  title,
  onClose,
  fixedHeight,
  onTop,
  covered,
  action,
  headerAction,
  children,
}: SheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      // A confirmation over the sheet answers for itself first: escaping out of
      // both at once would take the sheet away before the question was read.
      if (e.key === 'Escape' && !document.querySelector('.confirm-scrim')) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const drag = useSheetDrag(onClose);
  const className = [
    'sheet',
    open ? 'show' : '',
    fixedHeight ? 'tall' : '',
    onTop ? 'over' : '',
    covered ? 'covered' : '',
    drag.dragging ? 'dragging' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <div
        className={[open ? 'scrim show' : 'scrim', onTop ? 'over' : ''].filter(Boolean).join(' ')}
        onClick={onClose}
        aria-hidden="true"
      />
      {/* inert, not aria-hidden: it hides the sheet from assistive tech *and*
          takes focus off whatever was focused when it closed. */}
      <div
        className={className}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        inert={!open}
        style={drag.offset > 0 ? { transform: `translateY(${drag.offset}px)` } : undefined}
      >
        {/* the handle: drag it down to put the sheet away */}
        <span className="sheet-grip" {...drag.handlers} />
        <div className="sheet-head">
          <h2>{title}</h2>
          {headerAction}
        </div>
        <div className="sheet-body">{children}</div>
        {action}
        <button className="close" type="button" onClick={onClose}>
          {en.close}
        </button>
      </div>
    </>
  );
}
