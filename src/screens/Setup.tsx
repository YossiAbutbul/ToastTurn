import { useState } from 'react';
import { useFamily } from '../store/useFamily';
import { useDragReorder } from '../hooks/useDragReorder';
import { PersonRow } from '../components/PersonRow';
import { en } from '../i18n/en';
import { newFamilyCode, newId } from '../lib/id';
import { PALETTE, colorForIndex } from '../lib/palette';
import type { Family, Person } from '../lib/types';
import './Setup.css';

const ROW_HEIGHT = 62;

const blankFamily = (): Family => ({
  id: newFamilyCode(),
  name: '',
  people: [],
  schedule: { weekday: 0, time: '20:00', remind: true },
  turns: [],
});

export function Setup({ onDone }: { onDone: () => void }) {
  const { state, dispatch } = useFamily();
  const existing = state.family;
  // Starting a rotation only asks who you are. Everyone else arrives by asking
  // to join, or gets added from settings later.
  const firstRun = !existing;

  const [name, setName] = useState(existing?.name ?? '');
  const [people, setPeople] = useState<Person[]>(
    () => [...(existing?.people ?? [])].sort((a, b) => a.order - b.order),
  );
  const [draft, setDraft] = useState('');
  const [color, setColor] = useState<string>(colorForIndex(existing?.people.length ?? 0));

  const reorder = useDragReorder({
    count: people.length,
    itemHeight: ROW_HEIGHT,
    onMove: (from, to) =>
      setPeople((list) => {
        const next = [...list];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        return next.map((p, i) => ({ ...p, order: i }));
      }),
  });

  const addPerson = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    setPeople((list) => [
      ...list,
      { id: newId(), name: trimmed, color, order: list.length, active: true },
    ]);
    setDraft('');
    setColor(colorForIndex(people.length + 1));
  };

  const recolour = (id: string) =>
    setPeople((list) =>
      list.map((p) =>
        p.id === id ? { ...p, color: PALETTE[(PALETTE.indexOf(p.color as never) + 1) % PALETTE.length] } : p,
      ),
    );

  const removePerson = (id: string) =>
    setPeople((list) => list.filter((p) => p.id !== id).map((p, i) => ({ ...p, order: i })));

  const save = () => {
    const base = existing ?? blankFamily();
    const roster = firstRun
      ? [{ id: newId(), name: draft.trim(), color: colorForIndex(0), order: 0, active: true }]
      : people.map((p, i) => ({ ...p, order: i }));

    dispatch({
      type: 'createFamily',
      family: {
        ...base,
        name: name.trim() || base.name,
        people: roster,
        // The rotation knows which of its people is the one who started it.
        ownerPersonId: firstRun ? roster[0].id : base.ownerPersonId,
      },
    });
    onDone();
  };

  return (
    <div className="device setup">
      <div className="bar">
        <div className="mark">
          {en.brand.first}
          <span>{en.brand.second}</span>
        </div>
      </div>

      <div className="setup-body">
        <h1>{existing ? en.setup.editTitle : en.setup.title}</h1>

        <div className="fieldlabel">{en.setup.familyLabel}</div>
        <input
          type="text"
          value={name}
          aria-label={en.setup.familyLabel}
          placeholder={en.setup.familyPlaceholder}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="fieldlabel spaced">{firstRun ? en.setup.yourName : en.setup.peopleLabel}</div>

        {firstRun && (
          <>
            <input
              type="text"
              value={draft}
              aria-label={en.setup.yourName}
              placeholder={en.setup.namePlaceholder}
              onChange={(e) => setDraft(e.target.value)}
            />
            <p className="empty">{en.setup.yourNameHint}</p>
          </>
        )}

        {!firstRun && people.length === 0 && <p className="empty">{en.setup.empty}</p>}

        {!firstRun && (
          <>
        <ul className="people" style={{ height: people.length * ROW_HEIGHT }}>
          {people.map((person, i) => (
            <PersonRow
              key={person.id}
              person={person}
              top={i * ROW_HEIGHT}
              offset={reorder.offsetFor(i)}
              lifted={reorder.dragging === i}
              drag={reorder.handlers(i)}
              onRemove={() => removePerson(person.id)}
              onRecolour={() => recolour(person.id)}
            />
          ))}
        </ul>

        {people.length > 1 && <p className="empty">{en.setup.dragHint}</p>}

        <div className="swatches" role="group" aria-label={en.setup.colourLabel}>
          {PALETTE.map((swatch) => (
            <button
              key={swatch}
              type="button"
              className={swatch === color ? 'swatch on' : 'swatch'}
              style={{ background: swatch }}
              aria-label={swatch}
              aria-pressed={swatch === color}
              onClick={() => setColor(swatch)}
            />
          ))}
        </div>

        <div className="addrow">
          <input
            type="text"
            value={draft}
            aria-label={en.setup.namePlaceholder}
            placeholder={en.setup.namePlaceholder}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addPerson()}
          />
          <button type="button" className="ghost add" onClick={addPerson}>
            {en.setup.add}
          </button>
        </div>
          </>
        )}
      </div>

      <div className="setup-foot">
        <button className="close" type="button" onClick={save} disabled={firstRun ? draft.trim().length === 0 : people.length === 0}>
          {existing ? en.setup.save : en.setup.start}
        </button>
      </div>
    </div>
  );
}
