import { useState } from 'react';
import { ToastSlice } from '../components/ToastSlice';
import { en } from '../i18n/en';
import './Waiting.css';

type WaitingProps = {
  /** The rotation they were invited to, once its name has come down. */
  familyName: string;
  /** 'stranger' has not asked yet; 'pending' is waiting on the owner. */
  state: 'stranger' | 'pending';
  onAsk: (name: string) => void;
  onSignOut: () => void;
};

/**
 * Where a link lands someone who is not in the rotation yet. They say who they
 * are, and then wait: the toast is nobody's business until the owner lets them
 * in, so there is no lever and no history behind this screen.
 */
export function Waiting({ familyName, state, onAsk, onSignOut }: WaitingProps) {
  const [name, setName] = useState('');
  // The nudge has nowhere to go yet, so for now it only says it went.
  const [nudged, setNudged] = useState(false);

  const ask = () => {
    if (!name.trim()) return;
    onAsk(name);
  };

  return (
    <div className="device waiting">
      <div className="waiting-body">
        <div className="mark">
          {en.brand.first}
          <span>{en.brand.second}</span>
        </div>

        <h1 className="waiting-title">
          {state === 'pending' ? en.member.waitTitle : en.member.askTitle}
        </h1>
        <p className="waiting-line">
          {familyName ? en.member.invitedTo(familyName) : en.member.invitedToRotation}
        </p>

        {/* Standing on the counter, the way the welcome's slice does. */}
        <div className="waiting-slice">
          <ToastSlice />
        </div>
      </div>

      <div className="waiting-foot">
        {state === 'stranger' ? (
          <>
            <p className="empty">{en.member.askBlurb}</p>
            <div className="fieldlabel spaced">{en.member.yourName}</div>
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
          </>
        ) : (
          <>
            <p className="empty">{nudged ? en.member.nudgeBlurb : en.member.waitBlurb}</p>
            <button className="close" type="button" disabled={nudged} onClick={() => setNudged(true)}>
              {nudged ? en.member.nudgeSent : en.member.nudge}
            </button>
          </>
        )}

        <button className="waiting-plain" type="button" onClick={onSignOut}>
          {en.member.notYou}
        </button>
      </div>
    </div>
  );
}
