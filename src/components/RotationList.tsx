import { useState } from 'react';
import { PenIcon } from './PenIcon';
import { RenameFamily } from './RenameFamily';
import { en } from '../i18n/en';
import { initialOf } from '../lib/format';
import type { Family } from '../lib/types';

type RotationListProps = {
  /** Every rotation this phone is in, the open one first. */
  families: Family[];
  openId: string;
  onSwitch: (id: string) => void;
  onNew: () => void;
  /** Owner only: change what the open rotation is called. */
  onRename?: (name: string) => void;
};

/** One family was never enough: the others wait here, a tap from being open. */
export function RotationList({ families, openId, onSwitch, onNew, onRename }: RotationListProps) {
  const [renaming, setRenaming] = useState(false);
  const open = families.find((family) => family.id === openId);
  return (
    <>
      {families.map((family) => {
        const isOpen = family.id === openId;
        return (
          <div className="pickrow" key={family.id}>
            <button
              type="button"
              className="pickbtn"
              disabled={isOpen}
              onClick={() => onSwitch(family.id)}
            >
              <span className="mini" style={{ background: family.people[0]?.color }}>
                {initialOf(family.name || family.id)}
              </span>
              <b>{family.name || family.id}</b>
            </button>

            {/* Beside the name, because that is what it changes. Only on the
                one that is open, and only for whoever runs it: the name is
                the family's, not this phone's note to itself. */}
            {isOpen && onRename && (
              <button
                type="button"
                className="row-x"
                aria-label={en.settings.renameFamily}
                onClick={() => setRenaming(true)}
              >
                <PenIcon />
              </button>
            )}

            {/* Out of the button so the pen can sit next to the name: it says
                what tapping does, and the tapping is the button's. */}
            <span className="when">{isOpen ? en.settings.openNow : en.settings.openRotation}</span>
          </div>
        );
      })}

      <button className="ghost" type="button" onClick={onNew}>
        {en.settings.newRotation}
      </button>

      {onRename && (
        <RenameFamily
          open={renaming}
          name={open?.name ?? ''}
          onClose={() => setRenaming(false)}
          onSave={onRename}
        />
      )}
    </>
  );
}
