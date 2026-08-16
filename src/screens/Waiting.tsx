import { useState } from 'react';
import { Gate } from '../components/Gate';
import { en } from '../i18n/en';

type WaitingProps = {
  /** The rotation they were invited to, once its name has come down. */
  familyName: string;
  /** 'stranger' has not asked yet; 'pending' is waiting on the owner. */
  state: 'stranger' | 'pending';
  onAsk: (name: string) => void;
  onSignOut: () => void;
};

/**
 * The two steps between a link and the rotation: say who you are, then wait.
 * Neither shows any of the rotation itself.
 */
export function Waiting({ familyName, state, onAsk, onSignOut }: WaitingProps) {
  const [name, setName] = useState('');
  // The reminder has nowhere to go yet, so for now it only says it went.
  const [nudged, setNudged] = useState(false);

  const rotation = familyName.trim() || en.invite.unnamed;

  const ask = () => {
    if (!name.trim()) return;
    onAsk(name);
  };

  if (state === 'pending') {
    return (
      <Gate waiting kicker={rotation} title={en.member.waitTitle} sub={en.member.waitBlurb}>
        <p className="empty">{nudged ? en.member.nudgeBlurb : en.member.nudgeHint}</p>
        <button className="close" type="button" disabled={nudged} onClick={() => setNudged(true)}>
          {nudged ? en.member.nudgeSent : en.member.nudge}
        </button>
        <button className="gate-plain" type="button" onClick={onSignOut}>
          {en.member.notYou}
        </button>
      </Gate>
    );
  }

  return (
    <Gate kicker={en.invite.kicker} title={rotation} sub={en.member.askBlurb}>
      <div className="fieldlabel">{en.member.yourName}</div>
      <input
        type="text"
        aria-label={en.member.yourName}
        placeholder={en.setup.namePlaceholder}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && ask()}
      />
      <button className="close" type="button" disabled={!name.trim()} onClick={ask}>
        {en.member.askAction}
      </button>
      <button className="gate-plain" type="button" onClick={onSignOut}>
        {en.member.notYou}
      </button>
    </Gate>
  );
}
