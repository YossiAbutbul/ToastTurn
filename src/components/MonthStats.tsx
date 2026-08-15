import { en } from '../i18n/en';
import { initialOf } from '../lib/format';
import { monthRange, turnCounts } from '../lib/rotation';
import type { Family } from '../lib/types';
import './MonthStats.css';

/** Turns per person this month, so nobody has to argue about who does more. */
export function MonthStats({ family, now }: { family: Family; now: Date }) {
  const counts = turnCounts(family, monthRange(now));
  const people = [...family.people].sort((a, b) => a.order - b.order);
  const most = Math.max(1, ...people.map((p) => counts[p.id] ?? 0));
  const total = people.reduce((sum, p) => sum + (counts[p.id] ?? 0), 0);

  if (total === 0) return <p className="empty">{en.history.noneThisMonth}</p>;

  return (
    <div className="stats">
      {people.map((person) => {
        const count = counts[person.id] ?? 0;
        return (
          <div className="stat" key={person.id}>
            <span className="mini" style={{ background: person.color }}>
              {initialOf(person.name)}
            </span>
            <b>{person.name}</b>
            <span className="stat-track">
              <i style={{ width: `${(count / most) * 100}%`, background: person.color }} />
            </span>
            <span className="stat-count">{count}</span>
          </div>
        );
      })}
    </div>
  );
}
