import { useState } from 'react';
import { Sheet } from './Sheet';
import { en } from '../i18n/en';

type JoinRequestSheetProps = {
  open: boolean;
  onClose: () => void;
  onAsk: (name: string) => void;
};

/**
 * What a newcomer fills in: their name. It goes to whoever runs the rotation,
 * who adds them to it when they let them in — so nobody picks themselves off a
 * list, and nobody joins as somebody else.
 */
export function JoinRequestSheet({ open, onClose, onAsk }: JoinRequestSheetProps) {
  const [name, setName] = useState('');

  const ask = () => {
    if (!name.trim()) return;
    onAsk(name);
    setName('');
  };

  return (
    <Sheet open={open} title={en.member.askTitle} onClose={onClose}>
      <p className="empty">{en.member.askBlurb}</p>

      <div className="fieldlabel spaced">{en.member.yourName}</div>
      <input
        type="text"
        aria-label={en.member.yourName}
        placeholder={en.setup.namePlaceholder}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && ask()}
      />

      <button className="ghost" type="button" disabled={!name.trim()} onClick={ask}>
        {en.member.ask}
      </button>
    </Sheet>
  );
}
