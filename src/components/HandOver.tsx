import { useState } from 'react';
import { Confirm } from './Confirm';
import { en } from '../i18n/en';
import { initialOf } from '../lib/format';
import type { Family } from '../lib/types';

type Candidate = { uid: string; personId: string; email: string };

type HandOverProps = {
  family: Family;
  /** Everyone let in who is somebody in the rotation. */
  approved: Candidate[];
  onHandOver: (uid: string, personId: string) => void;
};

/**
 * Passing the rotation on.
 *
 * One account runs a family, and until now it was the one that started it, for
 * good: losing that account left the people, the schedule and the toast night
 * beyond anyone's reach. So the owner may hand it to somebody already in the
 * rotation. It only goes one way - the new owner is the only one who can pass
 * it on again - so it is asked plainly before it happens.
 */
export function HandOver({ family, approved, onHandOver }: HandOverProps) {
  const [asking, setAsking] = useState<Candidate | null>(null);

  const named = approved
    .map((candidate) => ({
      ...candidate,
      person: family.people.find((p) => p.id === candidate.personId),
    }))
    .filter((candidate) => candidate.person);

  const asked = asking && family.people.find((p) => p.id === asking.personId);

  return (
    <>
      <div className="fieldlabel spaced">{en.settings.handOver}</div>

      {named.length === 0 ? (
        <p className="empty">{en.settings.handOverNobody}</p>
      ) : (
        <p className="empty">{en.settings.handOverNote}</p>
      )}

      {named.map((candidate) => (
        <button
          className="pickbtn"
          type="button"
          key={candidate.uid}
          aria-label={en.settings.handOverPick(candidate.person!.name)}
          onClick={() => setAsking(candidate)}
        >
          <span className="mini" style={{ background: candidate.person!.color }}>
            {initialOf(candidate.person!.name)}
          </span>
          <b>{candidate.person!.name}</b>
          <span className="when">{candidate.email}</span>
        </button>
      ))}

      <Confirm
        open={Boolean(asking && asked)}
        title={en.settings.handOverAsk(asked?.name ?? '')}
        note={en.settings.handOverAskNote(asked?.name ?? '')}
        confirmLabel={en.settings.handOverYes}
        cancelLabel={en.settings.handOverNo}
        onCancel={() => setAsking(null)}
        onConfirm={() => {
          if (asking) onHandOver(asking.uid, asking.personId);
          setAsking(null);
        }}
      />
    </>
  );
}
