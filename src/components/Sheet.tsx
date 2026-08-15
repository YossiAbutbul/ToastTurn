import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { en } from '../i18n/en';
import './Sheet.css';

type SheetProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  /** Hold one height whatever the content does, and scroll inside. */
  fixedHeight?: boolean;
  children: ReactNode;
};

/** The bottom sheet everything that isn't the answer lives behind. */
export function Sheet({ open, title, onClose, fixedHeight, children }: SheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const className = ['sheet', open ? 'show' : '', fixedHeight ? 'tall' : ''].join(' ').trim();

  return (
    <>
      <div className={open ? 'scrim show' : 'scrim'} onClick={onClose} aria-hidden="true" />
      {/* inert, not aria-hidden: it hides the sheet from assistive tech *and*
          takes focus off whatever was focused when it closed. */}
      <div className={className} role="dialog" aria-modal="true" aria-label={title} inert={!open}>
        <h2>{title}</h2>
        <div className="sheet-body">{children}</div>
        <button className="close" type="button" onClick={onClose}>
          {en.close}
        </button>
      </div>
    </>
  );
}
