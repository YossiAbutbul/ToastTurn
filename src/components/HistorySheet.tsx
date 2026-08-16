import { useState } from 'react';
import { Sheet } from './Sheet';
import { MonthStats } from './MonthStats';
import { MonthCalendar } from './MonthCalendar';
import { Stars } from './Stars';
import { en } from '../i18n/en';
import { formatShortDate } from '../lib/format';
import { getPerson } from '../lib/rotation';
import { myRating, verdict } from '../lib/ratings';
import { now } from '../lib/clock';
import type { Family } from '../lib/types';

type HistorySheetProps = {
  open: boolean;
  family: Family;
  onClose: () => void;
  onPickDay: (date: Date) => void;
  covered?: boolean;
  onRate: (turnId: string, rating: number) => void;
  /** The account doing the rating, if anyone is signed in. */
  uid?: string;
};

type Tab = 'calendar' | 'list';

/** Two ways to look back: the month laid out, or everything in a line. */
export function HistorySheet({
  open,
  family,
  onClose,
  onPickDay,
  onRate,
  uid,
  covered,
}: HistorySheetProps) {
  const [tab, setTab] = useState<Tab>('calendar');

  return (
    <Sheet open={open} title={en.history.title} onClose={onClose} fixedHeight covered={covered}>
      <div className="tabs" role="tablist" aria-label={en.history.title}>
        <button
          type="button"
          role="tab"
          className={tab === 'calendar' ? 'tab on' : 'tab'}
          aria-selected={tab === 'calendar'}
          onClick={() => setTab('calendar')}
        >
          {en.history.tabCalendar}
        </button>
        <button
          type="button"
          role="tab"
          className={tab === 'list' ? 'tab on' : 'tab'}
          aria-selected={tab === 'list'}
          onClick={() => setTab('list')}
        >
          {en.history.tabList}
        </button>
      </div>

      {tab === 'calendar' ? (
        <MonthCalendar family={family} month={now()} onPickDay={onPickDay} />
      ) : (
        <>
          <div className="fieldlabel">{en.history.thisMonth}</div>
          <MonthStats family={family} now={now()} />

          <div className="fieldlabel spaced">{en.history.everyTurn}</div>
          {family.turns.length === 0 && <p className="empty">{en.history.empty}</p>}

          {family.turns.map((turn) => {
            const who = getPerson(family, turn.personId)?.name ?? '?';
            return (
              <div className="turn-row" key={turn.id}>
                <div className="turn-head">
                  <b>{turn.skipped ? en.day.nobody : who}</b>
                  <span className="when">{formatShortDate(turn.madeAt)}</span>
                </div>
                {!turn.skipped && (
                  <Stars
                    verdict={verdict(turn)}
                    mine={myRating(turn, uid)}
                    label={en.history.rate(who)}
                    onRate={(rating) => onRate(turn.id, rating)}
                  />
                )}
              </div>
            );
          })}
        </>
      )}
    </Sheet>
  );
}
