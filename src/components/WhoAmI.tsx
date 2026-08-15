import { Sheet } from './Sheet';
import { en } from '../i18n/en';
import { initialOf } from '../lib/format';
import type { Family } from '../lib/types';

type WhoAmIProps = {
  open: boolean;
  family: Family;
  onPick: (personId: string) => void;
  onClose: () => void;
};

/** Asked once per phone: which of these people are you? */
export function WhoAmI({ open, family, onPick, onClose }: WhoAmIProps) {
  const people = [...family.people].sort((a, b) => a.order - b.order);

  return (
    <Sheet open={open} title={en.whoAmI.title} onClose={onClose}>
      <p className="empty">{en.whoAmI.blurb}</p>
      {people.map((person) => (
        <button className="pickbtn" type="button" key={person.id} onClick={() => onPick(person.id)}>
          <span className="mini" style={{ background: person.color }}>
            {initialOf(person.name)}
          </span>
          <b>{person.name}</b>
        </button>
      ))}
    </Sheet>
  );
}
