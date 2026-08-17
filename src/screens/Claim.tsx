import { useState } from 'react';
import { Gate } from '../components/Gate';
import { en } from '../i18n/en';
import { initialOf } from '../lib/format';
import type { Family } from '../lib/types';
import './Claim.css';

type ClaimProps = {
  family: Family;
  /** People another phone already answers for, said but not enforced. */
  taken: Set<string>;
  onClaim: (personId: string) => void;
  onJoinAs: (name: string) => void;
};

/**
 * Where a link lands somebody the rotation has not met.
 *
 * There is nothing to ask for and nobody to wait on: the owner wrote these
 * names when they made the rotation, so being in it is a matter of saying
 * which one is you. Anyone the owner did not write down puts themselves in.
 */
export function Claim({ family, taken, onClaim, onJoinAs }: ClaimProps) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');

  // Whoever runs the rotation is not one of the names to tap. Their account is
  // how they get back, on any phone, so offering their name here would only
  // ever be somebody else taking it - and taking their orders and their colour
  // with it.
  const people = [...family.people]
    .filter((person) => person.id !== family.ownerPersonId)
    .sort((a, b) => a.order - b.order);
  const rotation = family.name.trim() || en.invite.unnamed;

  const join = () => {
    if (!name.trim()) return;
    onJoinAs(name);
  };

  if (adding || people.length === 0) {
    return (
      <Gate kicker={rotation} title={en.claim.newTitle} sub={en.claim.newBlurb}>
        <div className="fieldlabel">{en.member.yourName}</div>
        <input
          type="text"
          aria-label={en.member.yourName}
          placeholder={en.setup.namePlaceholder}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && join()}
        />
        <button className="close" type="button" disabled={!name.trim()} onClick={join}>
          {en.claim.newAction}
        </button>
        {people.length > 0 && (
          <button className="gate-plain" type="button" onClick={() => setAdding(false)}>
            {en.claim.backToList}
          </button>
        )}
      </Gate>
    );
  }

  return (
    <Gate kicker={rotation} title={en.claim.title} sub={en.claim.blurb}>
      <div className="claim-list">
        {people.map((person) => (
          <button
            className="pickbtn"
            type="button"
            key={person.id}
            onClick={() => onClaim(person.id)}
          >
            <span className="mini" style={{ background: person.color }}>
              {initialOf(person.name)}
            </span>
            <b>{person.name}</b>
            {taken.has(person.id) && <span className="when">{en.claim.taken}</span>}
          </button>
        ))}
      </div>

      <button className="gate-plain" type="button" onClick={() => setAdding(true)}>
        {en.claim.notListed}
      </button>
    </Gate>
  );
}
