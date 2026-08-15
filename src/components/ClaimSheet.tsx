import { Sheet } from './Sheet';
import { en } from '../i18n/en';
import { initialOf } from '../lib/format';
import type { Family } from '../lib/types';

type ClaimSheetProps = {
  open: boolean;
  family: Family;
  onPick: (personId: string) => void;
  onClose: () => void;
};

/** Asked once per account: which of these people are you? */
export function ClaimSheet({ open, family, onPick, onClose }: ClaimSheetProps) {
  const people = [...family.people].sort((a, b) => a.order - b.order);

  return (
    <Sheet open={open} title={en.claim.title} onClose={onClose}>
      <p className="empty">{en.claim.blurb}</p>
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
