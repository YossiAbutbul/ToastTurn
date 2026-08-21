import { useEffect, useRef, useState } from 'react';
import { useFlipRow } from '../hooks/useFlipRow';
import { initialOf } from '../lib/format';
import type { Person } from '../lib/types';
import './QueueBar.css';

/** Long enough for the last slice to have landed, and then some. */
const LANDED_MS = 1300;

type QueueBarProps = {
  /** The whole rotation, in order, whoever is up first. */
  people: Person[];
  /** Tapping anyone in the queue opens what they want. Left out for guests. */
  onPick?: (personId: string) => void;
  openLabel: (name: string) => string;
  nowLabel: (name: string) => string;
  /** How many slices each person still has coming, by person id. */
  slices: Record<string, number>;
  orderLabel: (name: string, slices: number) => string;
  /** Owner only: the way in to who is in the rotation and in what order. */
  onManage?: () => void;
  manageLabel: string;
};

/**
 * The rotation along the bottom: everyone, in order, the person who is up
 * standing proud of the line. Logging a turn moves the rotation on, so they
 * slide to the back of the queue on their own.
 */
export function QueueBar({
  people,
  onPick,
  openLabel,
  nowLabel,
  slices,
  orderLabel,
  onManage,
  manageLabel,
}: QueueBarProps) {
  // Logging a turn moves whoever made it to the back of the line. They walk
  // there rather than teleporting.
  const row = useRef<HTMLDivElement>(null);
  useFlipRow(row);

  // The queue lands a slice at a time as the app opens, and then that is over
  // with. It cannot be left standing in the CSS: the delay each slice takes is
  // read off its place in the row, so the moment somebody moves, everyone
  // after them is handed a different one - which re-times an animation that
  // had finished and plays part of it again, from nothing, over the walk they
  // were meant to be taking.
  const [landing, setLanding] = useState(true);
  useEffect(() => {
    const done = window.setTimeout(() => setLanding(false), LANDED_MS);
    return () => window.clearTimeout(done);
  }, []);

  return (
    <div className={landing ? 'queue landing' : 'queue'} ref={row}>
      {people.map((person, index) => {
        const className = index === 0 ? 'qbtn now' : 'qbtn';
        const label = index === 0 ? nowLabel(person.name) : openLabel(person.name);
        const wanted = slices[person.id] ?? 0;

        const inside = (
          <>
            {/* Everyone keeps their own colour, up or not, being up is said
                with height and a heavier outline instead. */}
            <span className="qtoast" style={{ background: person.color }}>
              {initialOf(person.name)}
              {/* A badge says one thing and one thing only: how many slices
                  are still to make for this person. Asking for an order is the
                  button's job, and saying it twice read as clutter. */}
              {wanted > 0 && (
                <i className="qbadge" aria-label={orderLabel(person.name, wanted)}>
                  {wanted}
                </i>
              )}
            </span>
            <span className="qname">{person.name}</span>
          </>
        );

        return onPick ? (
          <button
            key={person.id}
            data-flip={person.id}
            type="button"
            className={className}
            onClick={() => onPick(person.id)}
            aria-label={label}
          >
            {inside}
          </button>
        ) : (
          <div key={person.id} data-flip={person.id} className={className} aria-label={label}>
            {inside}
          </div>
        );
      })}

      {/* The rotation is what this bar is, so the way to arrange it belongs
          on the end of it rather than three taps away in the settings. */}
      {onManage && (
        <button type="button" className="qbtn manage" onClick={onManage} aria-label={manageLabel}>
          <span className="qtoast qadd" aria-hidden="true">
            +
          </span>
        </button>
      )}
    </div>
  );
}
