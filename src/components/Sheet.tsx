import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { en } from '../i18n/en';
import './Sheet.css';

type SheetProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

/** The bottom sheet everything that isn't the answer lives behind. */
export function Sheet({ open, title, onClose, children }: SheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <>
      <div className={open ? 'scrim show' : 'scrim'} onClick={onClose} aria-hidden="true" />
      <div
        className={open ? 'sheet show' : 'sheet'}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        aria-hidden={!open}
      >
        <h2>{title}</h2>
        {children}
        <button className="close" type="button" onClick={onClose}>
          {en.close}
        </button>
      </div>
    </>
  );
}
