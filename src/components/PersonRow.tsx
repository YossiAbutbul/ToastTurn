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
  /** Tapping the toast moves them to the next colour in the palette. */
  onRecolour: () => void;
};

/** One name in the setup list: drag it to reorder, tap the toast to recolour. */
export function PersonRow({ person, top, offset, lifted, drag, onRemove, onRecolour }: PersonRowProps) {
  return (
    <li
      className={lifted ? 'person-row lifted' : 'person-row'}
      style={{ top, transform: `translateY(${offset}px)` }}
    >
      <span className="grip" role="button" tabIndex={0} aria-label={en.setup.dragLabel(person.name)} {...drag}>
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="M3 5h10M3 8h10M3 11h10" />
        </svg>
      </span>

      <button
        type="button"
        className="mini recolour"
        style={{ background: person.color }}
        aria-label={en.setup.recolour(person.name)}
        onClick={onRecolour}
      >
        {initialOf(person.name)}
      </button>

      <b>{person.name}</b>

      <button type="button" className="remove" aria-label={en.setup.remove(person.name)} onClick={onRemove}>
        ×
      </button>
    </li>
  );
}
