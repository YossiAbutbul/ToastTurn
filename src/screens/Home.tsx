import { useCallback, useEffect, useRef, useState } from 'react';
import { Toaster } from '../components/Toaster';
import type { ToasterStatus } from '../components/Toaster';
import { TopBar } from '../components/TopBar';
import { QueueBar } from '../components/QueueBar';
import { Note } from '../components/Note';
import { InstallHint } from '../components/InstallHint';
import { HistorySheet } from '../components/HistorySheet';
import { SwapSheet } from '../components/SwapSheet';
import { ScheduleSheet } from '../components/ScheduleSheet';
import { SettingsSheet } from '../components/SettingsSheet';
import { useFamily } from '../store/useFamily';
import { en } from '../i18n/en';
import { formatShortDate, initialOf } from '../lib/format';
import { getCurrentPerson, getUpcoming, lastTurnFor, turnCounts } from '../lib/rotation';
import { todayISO } from '../lib/clock';
import { newId } from '../lib/id';
import type { Family } from '../lib/types';
import './Home.css';

type SheetName = 'history' | 'swap' | 'schedule' | 'settings' | null;

const FLASH_MS = 2400;

export function Home({ onEditPeople }: { onEditPeople: () => void }) {
  const { state, dispatch } = useFamily();
  const family = state.family as Family;

  const [sheet, setSheet] = useState<SheetName>(null);
  const [status, setStatus] = useState<ToasterStatus>('idle');
  const [flash, setFlash] = useState<string | null>(null);
  const [note, setNote] = useState({ key: 0, text: '' });
  const flashTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(flashTimer.current), []);

  const current = getCurrentPerson(family);
  const upcoming = getUpcoming(family, 4);
  const closeSheet = useCallback(() => setSheet(null), []);

  const handlePop = useCallback(() => {
    const done = getCurrentPerson(family);
    if (!done) return;
    const next = getUpcoming(family, 1)[0];

    dispatch({ type: 'logTurn', id: newId(), madeAt: todayISO() });
    setNote((n) => ({ key: n.key + 1, text: en.lever.done(done.name) }));
    setFlash(next ? en.lever.logged(next.name, en.days[family.schedule.weekday]) : en.lever.loggedAlone);

    window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlash(null), FLASH_MS);
  }, [dispatch, family]);

  const bar = (
    <TopBar
      schedule={family.schedule}
      onSchedule={() => setSheet('schedule')}
      onHistory={() => setSheet('history')}
      onSettings={() => setSheet('settings')}
    />
  );

  const sheets = (
    <>
      <HistorySheet
        open={sheet === 'history'}
        family={family}
        onClose={closeSheet}
        onSkip={() => {
          dispatch({ type: 'skipWeek', id: newId(), madeAt: todayISO() });
          closeSheet();
        }}
      />
      <ScheduleSheet
        open={sheet === 'schedule'}
        schedule={family.schedule}
        onClose={closeSheet}
        onChange={(schedule) => dispatch({ type: 'setSchedule', schedule })}
      />
      <SettingsSheet
        open={sheet === 'settings'}
        family={family}
        onClose={closeSheet}
        onEditPeople={onEditPeople}
        onToggleHoliday={(id, active) => dispatch({ type: 'setActive', id, active })}
        onStartOver={() => {
          if (window.confirm(en.settings.startOverConfirm)) dispatch({ type: 'reset' });
        }}
      />
    </>
  );

  if (!current) {
    return (
      <div className="device">
        {bar}
        <div className="head">
          <p className="sub">{en.home.nobodyYet}</p>
          <button className="ghost inline" type="button" onClick={onEditPeople}>
            {en.home.addPeople}
          </button>
        </div>
        <div className="scene" />
        {sheets}
      </div>
    );
  }

  const last = lastTurnFor(family, current.id);
  const hint = flash ?? en.lever[status === 'popped' ? 'idle' : status];

  return (
    <div className="device">
      {bar}

      <div className="head">
        <div className="kicker">{en.home.kicker}</div>
        <div className="big">{current.name}</div>
        <div className="sub">
          {last
            ? en.home.turnsSoFar(turnCounts(family)[current.id] ?? 0, formatShortDate(last.madeAt))
            : en.home.firstTurn}
        </div>
      </div>

      <div className="scene">
        <Toaster
          initial={initialOf(current.name)}
          onPop={handlePop}
          onStatus={setStatus}
          leverLabel={en.lever.label}
        />
      </div>

      <div className="hint">{hint}</div>

      <InstallHint />
      <QueueBar people={upcoming} onPick={() => setSheet('swap')} swapLabel={en.swap.title} />
      <Note playKey={note.key} text={note.text} />

      <SwapSheet
        open={sheet === 'swap'}
        family={family}
        current={current}
        onClose={closeSheet}
        onSwap={(personId) => {
          dispatch({ type: 'swap', aId: current.id, bId: personId });
          closeSheet();
        }}
      />
      {sheets}
    </div>
  );
}
