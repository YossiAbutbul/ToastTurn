import { useState } from 'react';
import { Sheet } from './Sheet';
import { en } from '../i18n/en';
import { familyIdFromInput, pathForFamily } from '../lib/url';

/** For someone who has the link but opened the app instead of tapping it. */
export function JoinSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [text, setText] = useState('');
  const [problem, setProblem] = useState(false);

  const join = () => {
    const id = familyIdFromInput(text);
    if (!id) {
      setProblem(true);
      return;
    }
    window.location.href = pathForFamily(id);
  };

  return (
    <Sheet open={open} title={en.join.title} onClose={onClose}>
      <p className="empty">{en.join.blurb}</p>

      <div className="fieldlabel spaced">{en.join.label}</div>
      <input
        type="text"
        aria-label={en.join.label}
        placeholder={en.join.placeholder}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setProblem(false);
        }}
        onKeyDown={(e) => e.key === 'Enter' && join()}
      />

      {problem && <p className="problem">{en.join.problem}</p>}

      <button className="ghost primary" type="button" onClick={join}>
        {en.join.action}
      </button>
    </Sheet>
  );
}
