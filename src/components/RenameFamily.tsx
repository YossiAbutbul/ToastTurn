import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { en } from '../i18n/en';
import './Confirm.css';

type RenameFamilyProps = {
  open: boolean;
  name: string;
  onClose: () => void;
  onSave: (name: string) => void;
};

/**
 * What the rotation is called, asked in the same card as everything else that
 * is asked. Through a portal for the same reason Confirm is: a sheet is moved
 * with a transform, and a transformed ancestor makes a fixed child position
 * against the sheet rather than the screen.
 */
export function RenameFamily({ open, name, onClose, onSave }: RenameFamilyProps) {
  const [draft, setDraft] = useState(name);
  // Opening it again after a change elsewhere should show what it is called
  // now, not what it was called the first time this was opened.
  const [was, setWas] = useState(name);
  if (was !== name) {
    setWas(name);
    setDraft(name);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const save = () => {
    const trimmed = draft.trim();
    if (trimmed) onSave(trimmed);
    onClose();
  };

  return createPortal(
    <div className="confirm-scrim" onClick={onClose}>
      <div
        className="confirm-card"
        role="dialog"
        aria-modal="true"
        aria-label={en.settings.renameTitle}
        onClick={(e) => e.stopPropagation()}
      >
        <b>{en.settings.renameTitle}</b>

        <input
          type="text"
          className="note-input"
          aria-label={en.settings.renameLabel}
          placeholder={en.setup.familyPlaceholder}
          value={draft}
          autoFocus
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && save()}
        />

        <div className="confirm-row">
          <button className="ghost" type="button" onClick={onClose}>
            {en.settings.renameCancel}
          </button>
          <button
            className="ghost primary"
            type="button"
            disabled={draft.trim().length === 0}
            onClick={save}
          >
            {en.settings.renameSave}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
