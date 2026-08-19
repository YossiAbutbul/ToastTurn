import { useState } from 'react';
import { useFamily } from '../store/useFamily';
import { Wordmark } from '../components/Wordmark';
import { JoinSheet } from '../components/JoinSheet';
import { en } from '../i18n/en';
import { newFamilyCode, newId } from '../lib/id';
import { colorForIndex } from '../lib/palette';
import type { Family } from '../lib/types';
import './Setup.css';

type SetupProps = {
  onDone: () => void;
  /** Leaving without starting anything: back where you came from. */
  onBack: () => void;
};

/**
 * Starting a rotation: what it is called, and who you are in it.
 *
 * It used to be the whole rotation - the list, the dragging, the colours -
 * because there was nowhere else to arrange one. There is now: the people
 * live in a sheet off the queue and the name behind a pen beside it. So this
 * asks the two things that cannot be asked anywhere else, and stops.
 */
export function Setup({ onDone, onBack }: SetupProps) {
  const { state, dispatch } = useFamily();
  // There is somewhere to go back to only when a rotation is already open.
  const canCancel = Boolean(state.family);

  const [name, setName] = useState('');
  const [yours, setYours] = useState('');
  /**
   * The other door. Whoever meant to join one and pressed start instead had
   * to guess their way back out to the welcome to find it; the two are the
   * same decision, so both are offered wherever either is.
   */
  const [joining, setJoining] = useState(false);

  const save = () => {
    const you = { id: newId(), name: yours.trim(), color: colorForIndex(0), order: 0, active: true };
    const family: Family = {
      id: newFamilyCode(),
      name: name.trim(),
      people: [you],
      turns: [],
      // The rotation knows which of its people is the one who started it.
      ownerPersonId: you.id,
    };
    dispatch({ type: 'createFamily', family });
    onDone();
  };

  return (
    <div className="device setup">
      <div className="bar">
        <button className="back" type="button" aria-label={en.setup.back} onClick={onBack}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 4 L7 12 L15 20" />
          </svg>
        </button>

        <Wordmark onClick={onBack} />
      </div>

      <div className="setup-body">
        <h1>{en.setup.title}</h1>

        <div className="fieldlabel">{en.setup.familyLabel}</div>
        <input
          type="text"
          value={name}
          aria-label={en.setup.familyLabel}
          placeholder={en.setup.familyPlaceholder}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="fieldlabel spaced">{en.setup.yourName}</div>
        <input
          type="text"
          value={yours}
          aria-label={en.setup.yourName}
          placeholder={en.setup.namePlaceholder}
          onChange={(e) => setYours(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && yours.trim() && save()}
        />
        <p className="empty">{en.setup.yourNameHint}</p>
      </div>

      <div className="setup-foot">
        <button className="close" type="button" onClick={save} disabled={yours.trim().length === 0}>
          {en.setup.start}
        </button>
        <button className="setup-back" type="button" onClick={() => setJoining(true)}>
          {en.setup.joinInstead}
        </button>

        <button className="setup-back" type="button" onClick={canCancel ? onDone : onBack}>
          {canCancel ? en.setup.cancel : en.setup.home}
        </button>
      </div>

      <JoinSheet open={joining} onClose={() => setJoining(false)} />
    </div>
  );
}
