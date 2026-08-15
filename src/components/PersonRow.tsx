import type { PointerEvent as ReactPointerEvent } from 'react';
import { en } from '../i18n/en';
import { initialOf } from '../lib/format';
import type { Person } from '../lib/types';

type DragHandlers = {
  onPointerDown: (e: ReactPointerEvent<HTMLElement>) => void;
  onPointerMove: (e: ReactPointerEvent<HTMLElement>) => void;
  onPointerUp: () => void;
  onPointerCancel: () => void;
};

type PersonRowProps = {
  person: Person;
  top: number;
  offset: number;
  lifted: boolean;
  drag: DragHandlers;
  onRemove: () => void;
  onEmail: (email: string) => void;
};

/** One draggable name in the setup list, with the address they sign in with. */
export function PersonRow({ person, top, offset, lifted, drag, onRemove, onEmail }: PersonRowProps) {
  return (
    <li
      className={lifted ? 'person-row lifted' : 'person-row'}
      style={{ top, transform: `translateY(${offset}px)` }}
    >
      <span
        className="grip"
        role="button"
        tabIndex={0}
        aria-label={en.setup.dragLabel(person.name)}
        {...drag}
      >
        <span className="mini" style={{ background: person.color }}>
          {initialOf(person.name)}
        </span>
      </span>
      <div className="person-fields">
        <b>{person.name}</b>
        <input
          type="text"
          inputMode="email"
          className="person-email"
          aria-label={en.setup.emailFor(person.name)}
          placeholder={en.setup.emailPlaceholder}
          value={person.email ?? ''}
          onChange={(e) => onEmail(e.target.value)}
        />
      </div>
      <button
        type="button"
        className="remove"
        aria-label={en.setup.remove(person.name)}
        onClick={onRemove}
      >
        ×
      </button>
    </li>
  );
}
