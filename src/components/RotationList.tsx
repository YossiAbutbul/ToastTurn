import { en } from '../i18n/en';
import { initialOf } from '../lib/format';
import type { Family } from '../lib/types';

type RotationListProps = {
  /** Every rotation this phone is in, the open one first. */
  families: Family[];
  openId: string;
  onSwitch: (id: string) => void;
  onNew: () => void;
};

/** One family was never enough: the others wait here, a tap from being open. */
export function RotationList({ families, openId, onSwitch, onNew }: RotationListProps) {
  return (
    <>
      {families.map((family) => {
        const isOpen = family.id === openId;
        return (
          <button
            key={family.id}
            type="button"
            className="pickbtn"
            disabled={isOpen}
            onClick={() => onSwitch(family.id)}
          >
            <span className="mini" style={{ background: family.people[0]?.color }}>
              {initialOf(family.name || family.id)}
            </span>
            <b>{family.name || family.id}</b>
            <span className="when">{isOpen ? en.settings.openNow : en.settings.openRotation}</span>
          </button>
        );
      })}

      <button className="ghost" type="button" onClick={onNew}>
        {en.settings.newRotation}
      </button>
    </>
  );
}
