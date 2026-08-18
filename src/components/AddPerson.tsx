import { useState } from 'react';
import { en } from '../i18n/en';
import { PALETTE } from '../lib/palette';

type AddPersonProps = {
  /** What colour to offer, which is whichever one comes next in the rotation. */
  suggested: string;
  onAdd: (name: string, color: string) => void;
};

/**
 * One more name in the rotation, added where the rotation is read.
 *
 * Adding someone used to mean a screen of its own. It is a name and a colour,
 * which is a row, and a row belongs beside the people it is joining.
 */
export function AddPerson({ suggested, onAdd }: AddPersonProps) {
  const [name, setName] = useState('');
  // The offer moves on as the rotation grows, so adding two people in a row
  // does not hand them both the same colour. Tagged with the offer it came
  // from, so a colour picked by hand is not overwritten by the next render.
  const [picked, setPicked] = useState({ from: suggested, color: suggested });
  if (picked.from !== suggested) setPicked({ from: suggested, color: suggested });
  const color = picked.color;

  const add = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd(trimmed, color);
    setName('');
  };

  return (
    <>
      <div className="swatches" role="group" aria-label={en.setup.colourLabel}>
        {PALETTE.map((swatch) => (
          <button
            key={swatch}
            type="button"
            className={swatch === color ? 'swatch on' : 'swatch'}
            style={{ background: swatch }}
            aria-label={swatch}
            aria-pressed={swatch === color}
            onClick={() => setPicked({ from: suggested, color: swatch })}
          />
        ))}
      </div>

      <div className="addrow">
        <input
          type="text"
          value={name}
          aria-label={en.settings.addPersonName}
          placeholder={en.settings.addPersonName}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
        />
        <button type="button" className="ghost add" onClick={add} disabled={name.trim().length === 0}>
          {en.settings.addPersonAction}
        </button>
      </div>
    </>
  );
}
