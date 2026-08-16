import type { ReactNode } from 'react';
import { ToastSlice } from './ToastSlice';
import { en } from '../i18n/en';
import './Gate.css';

type GateProps = {
  /** Small line above the name, for whose rotation this is. */
  kicker?: string;
  title: string;
  sub?: string;
  /** Three dots under the slice, for when it is out of your hands. */
  waiting?: boolean;
  /** The counter: whatever there is to do about it. */
  children: ReactNode;
  /**
   * Bottom sheets. They belong to the phone, not to the counter: a sheet is
   * positioned against the nearest positioned ancestor, and inside the foot
   * that would be a strip a few buttons tall.
   */
  sheets?: ReactNode;
};

/**
 * The screen for someone at the door. It shows the rotation's name and nothing
 * else of it: no toaster, no queue, no history, until they have been let in.
 */
export function Gate({ kicker, title, sub, waiting, children, sheets }: GateProps) {
  return (
    <div className="device gate">
      <div className="gate-body">
        <div className="mark">
          {en.brand.first}
          <span>{en.brand.second}</span>
        </div>

        {kicker && <div className="gate-kicker">{kicker}</div>}
        <h1 className="gate-title">{title}</h1>
        {sub && <p className="gate-sub">{sub}</p>}

        <div className={waiting ? 'gate-art waiting' : 'gate-art'}>
          <ToastSlice />
          {waiting && (
            <div className="gate-dots" aria-hidden="true">
              <i />
              <i />
              <i />
            </div>
          )}
        </div>
      </div>

      <div className="gate-foot">{children}</div>
      {sheets}
    </div>
  );
}
