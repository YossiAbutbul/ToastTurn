import { useCallback, useEffect, useRef, useState } from 'react';
import { Toaster } from '../components/Toaster';
import type { ToasterStatus } from '../components/Toaster';
import { TopBar } from '../components/TopBar';
import { QueueBar } from '../components/QueueBar';
import { Note } from '../components/Note';
import { InstallHint } from '../components/InstallHint';
import { HomeSheets } from '../components/HomeSheets';
import type { SheetName } from '../components/HomeSheets';
import { useIsOwner } from '../hooks/useIsOwner';
import { useAccount } from '../hooks/useAccount';
import { useMembership } from '../hooks/useMembership';
import { ClaimSheet } from '../components/ClaimSheet';
import { SignInSheet } from '../components/SignInSheet';
import { signOut } from '../lib/auth';
import { useFamily } from '../store/useFamily';
import { en } from '../i18n/en';
import { formatShortDate, initialOf } from '../lib/format';
import { getCurrentPerson, getUpcoming, lastTurnFor, turnCounts } from '../lib/rotation';
import { nowISO } from '../lib/clock';
import { newId } from '../lib/id';
import { deleteFamily } from '../lib/remote';
import type { Family } from '../lib/types';
import './Home.css';

const FLASH_MS = 2400;

type HomeProps = {
  onEditPeople: () => void;
  /** Signing out drops back to the welcome, without giving up the rotation. */
  onLeave: () => void;
};

export function Home({ onEditPeople, onLeave }: HomeProps) {
  const { state, dispatch } = useFamily();
  const family = state.family as Family;
  const isOwner = useIsOwner(family);
  const { account } = useAccount();
  const membership = useMembership(family, account, isOwner);
  const { me, canLog } = membership;

  const [sheet, setSheet] = useState<SheetName>(null);
  const [status, setStatus] = useState<ToasterStatus>('idle');
  const [flash, setFlash] = useState<string | null>(null);
  const [note, setNote] = useState({ key: 0, text: '' });
  const [signingIn, setSigningIn] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [skippedClaim, setSkippedClaim] = useState(false);
  const flashTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(flashTimer.current), []);

  const current = getCurrentPerson(family);
  const upcoming = getUpcoming(family, 4);
  const closeSheet = () => setSheet(null);

  const handlePop = useCallback(() => {
    const done = getCurrentPerson(family);
    if (!done) return;
    const next = getUpcoming(family, 1)[0];

    dispatch({ type: 'logTurn', id: newId(), madeAt: nowISO() });
    setNote((n) => ({ key: n.key + 1, text: en.lever.done(done.name) }));
    setFlash(next ? en.lever.logged(next.name, en.days[family.schedule.weekday]) : en.lever.loggedAlone);

    window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlash(null), FLASH_MS);
  }, [dispatch, family]);

  const sheets = (
    <>
      <HomeSheets
        sheet={sheet}
        family={family}
        current={current}
        account={account}
        onClose={closeSheet}
        onSkip={() => {
          dispatch({ type: 'skipWeek', id: newId(), madeAt: nowISO() });
          closeSheet();
        }}
        onSwap={(personId) => {
          if (current) dispatch({ type: 'swap', aId: current.id, bId: personId });
          closeSheet();
        }}
        onSchedule={(schedule) => dispatch({ type: 'setSchedule', schedule })}
        onToggleHoliday={(id, active) => dispatch({ type: 'setActive', id, active })}
        onEditPeople={onEditPeople}
        onStartOver={() => {
          if (!window.confirm(en.settings.startOverConfirm)) return;
          void deleteFamily(family.id);
          dispatch({ type: 'reset' });
          window.history.replaceState(null, '', '/');
        }}
        me={me}
        membership={membership}
        onClaim={() => {
          closeSheet();
          setClaiming(true);
        }}
        onSignIn={() => {
          closeSheet();
          setSigningIn(true);
        }}
        onSignOut={() => {
          closeSheet();
          void signOut().then(onLeave);
        }}
        isOwner={isOwner}
      />
      <SignInSheet open={signingIn} account={account} onClose={() => setSigningIn(false)} />
      <ClaimSheet
        open={claiming || (canLog && !me && !skippedClaim && family.people.length > 0)}
        family={family}
        onPick={(personId) => {
          membership.claim(personId);
          setClaiming(false);
        }}
        onClose={() => {
          setClaiming(false);
          setSkippedClaim(true);
        }}
      />
    </>
  );

  const bar = (
    <TopBar
      schedule={family.schedule}
      // The night lives in settings now, so the pill is a shortcut into it.
      onSchedule={isOwner ? () => setSheet('settings') : undefined}
      onHistory={() => setSheet('history')}
      onSettings={() => setSheet('settings')}
    />
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
  const idle = current.id === me?.id ? en.lever.idleYou : en.lever.idle;
  const hint = flash ?? (status === 'idle' || status === 'popped' ? idle : en.lever[status]);

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
          locked={!canLog}
          onPop={handlePop}
          onStatus={setStatus}
          leverLabel={en.lever.label}
        />
      </div>

      <div className="hint">{canLog ? hint : en.member.leverLocked}</div>

      {membership.state !== 'owner' && membership.state !== 'member' && (
        <div className="join-bar">
          <p>
            {membership.state === 'signed-out'
              ? en.member.signedOut
              : membership.state === 'pending'
                ? en.member.pending
                : en.member.askBlurb}
          </p>
          <button
            type="button"
            className="join-action"
            disabled={membership.state === 'pending'}
            onClick={() => {
              if (membership.state === 'signed-out') setSigningIn(true);
              else membership.askToJoin();
            }}
          >
            {membership.state === 'signed-out' ? en.signIn.action : en.member.ask}
          </button>
        </div>
      )}

      <InstallHint />
      <QueueBar
        people={upcoming}
        onPick={isOwner ? () => setSheet('swap') : undefined}
        swapLabel={en.swap.title}
      />
      <Note playKey={note.key} text={note.text} />

      {sheets}
    </div>
  );
}
