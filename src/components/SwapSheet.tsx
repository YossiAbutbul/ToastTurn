import { Sheet } from './Sheet';
import { en } from '../i18n/en';
import { initialOf } from '../lib/format';
import { turnCounts } from '../lib/rotation';
import type { Family, Person } from '../lib/types';

type SwapSheetProps = {
  open: boolean;
  family: Family;
  current: Person;
  onClose: () => void;
  onSwap: (personId: string) => void;
};

export function SwapSheet({ open, family, current, onClose, onSwap }: SwapSheetProps) {
  const counts = turnCounts(family);
  const others = [...family.people]
    .sort((a, b) => a.order - b.order)
    .filter((p) => p.id !== current.id);

  return (
    <Sheet open={open} title={en.swap.title(current.name)} onClose={onClose}>
      {others.length === 0 && <p className="empty">{en.swap.alone}</p>}

      {others.map((person) => (
        <button className="pickbtn" type="button" key={person.id} onClick={() => onSwap(person.id)}>
          <span className="mini" style={{ background: person.color }}>
            {initialOf(person.name)}
          </span>
          <b>{person.name}</b>
          <span className="when">
            {person.active ? en.swap.turns(counts[person.id] ?? 0) : en.swap.onHoliday}
          </span>
        </button>
      ))}
    </Sheet>
  );
}
