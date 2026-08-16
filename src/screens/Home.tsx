import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { useSwaps } from '../hooks/useSwaps';
import { useOrders } from '../hooks/useOrders';
import { SwapAsk } from '../components/SwapAsk';
import { OrdersButton } from '../components/OrdersButton';
import { Notice } from '../components/Notice';
import { SignInSheet } from '../components/SignInSheet';
import { Waiting } from './Waiting';
import { signOut } from '../lib/auth';
import { syncConfigured } from '../lib/firebase';
import { useFamily } from '../store/useFamily';
import { allFamilies } from '../store/familyReducer';
import { en } from '../i18n/en';
import { formatDayDate, formatShortDate, initialOf, isoForDay } from '../lib/format';
import {
  getCurrentPerson,
  getUpcoming,
  lastTurnFor,
  nextDue,
  rotationOrder,
  turnCounts,
  weekDone,
} from '../lib/rotation';
import { now, nowISO } from '../lib/clock';
import { newId } from '../lib/id';
import { colorForIndex } from '../lib/palette';
import { withMemberColors } from '../lib/people';
import { outstanding } from '../lib/orders';
import { deleteFamily, deleteTurn } from '../lib/remote';
import { replacePath } from '../lib/history';
import type { Family } from '../lib/types';
import './Home.css';

const FLASH_MS = 2400;

type HomeProps = {
  onEditPeople: () => void;
  /** Signing out drops back to the welcome, without giving up the rotation. */
  onLeave: () => void;
  /** Settings offers to start a second rotation without leaving this one. */
  onNewFamily: () => void;
};

export function Home({ onEditPeople, onLeave, onNewFamily }: HomeProps) {
  const { state, dispatch } = useFamily();
  const stored = state.family as Family;
  const isOwner = useIsOwner(stored);
  const { account } = useAccount();
  const membership = useMembership(stored, account, isOwner);
  const { canLog } = membership;
  // What everyone chose for themselves, over what the rotation has on file.
  // Display only: what goes back up is always the stored copy, or a phone
  // would publish colours that were never its to write.
  const family = useMemo(
    () => withMemberColors(stored, membership.colorsByPerson),
    [stored, membership.colorsByPerson],
  );
  const me = membership.me ? (family.people.find((p) => p.id === membership.me!.id) ?? null) : null;
  // With no keys there are no accounts, so a rating is filed under the phone.
  const ratingUid = account?.uid ?? (syncConfigured ? undefined : 'this-phone');

  const [sheet, setSheet] = useState<SheetName>(null);
  const [status, setStatus] = useState<ToasterStatus>('idle');
  const [flash, setFlash] = useState<string | null>(null);
  const [note, setNote] = useState({ key: 0, text: '' });
  const [signingIn, setSigningIn] = useState(false);
  const [day, setDay] = useState<Date | null>(null);
  /** Who the ask just went to, so it can be said plainly rather than in passing. */
  const [asked, setAsked] = useState<string | null>(null);
  const flashTimer = useRef<number | undefined>(undefined);

  /** A line along the bottom, the way the app talks after something happens. */
  const say = useCallback((text: string) => setNote((n) => ({ key: n.key + 1, text })), []);

  const applySwap = useCallback(
    (aId: string, bId: string) => dispatch({ type: 'swap', aId, bId }),
    [dispatch],
  );
  const swaps = useSwaps({ family: stored, me: membership.me, isOwner, onApply: applySwap });
  const orders = useOrders(family, membership.me?.id, isOwner);

  useEffect(() => () => window.clearTimeout(flashTimer.current), []);

  const current = getCurrentPerson(family);
  const queue = rotationOrder(family);
  const closeSheet = () => {
    setSheet(null);
    setDay(null);
  };

  // What was logged on the day tapped in the calendar.
  const dayTurns = day
    ? family.turns.filter((turn) => {
        const at = new Date(turn.madeAt.length <= 10 ? `${turn.madeAt}T00:00:00` : turn.madeAt);
        return (
          at.getFullYear() === day.getFullYear() &&
          at.getMonth() === day.getMonth() &&
          at.getDate() === day.getDate()
        );
      })
    : [];

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

  // A no comes back to whoever asked, once, and then comes off the board.
  const answer = swaps.answered;
  const { close } = swaps;
  useEffect(() => {
    if (!answer) return;
    const timer = window.setTimeout(() => {
      const them = stored.people.find((p) => p.id === answer.toPersonId);
      say(en.swap.declined(them?.name ?? ''));
      close(answer);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [answer, close, say, stored.people]);

  // Someone who followed an invite gets the waiting room, not the rotation:
  // the toast is nobody's business until the owner lets them in.
  if (membership.state === 'stranger' || membership.state === 'pending') {
    return (
      <Waiting
        familyName={family.name}
        state={membership.state}
        onAsk={membership.askToJoin}
        onSignOut={() => void signOut().then(onLeave)}
      />
    );
  }

  const approve = (uid: string, name: string) => {
    const wanted = name.trim().toLowerCase();
    const taken = new Set(
      membership.waiting.map(() => '').concat(family.people.map((p) => p.id)).filter(Boolean),
    );
    const existing = family.people.find(
      (p) => p.name.trim().toLowerCase() === wanted && taken.has(p.id),
    );

    if (existing && wanted) {
      membership.approve(uid, existing.id);
      return;
    }

    const person = {
      id: newId(),
      name: name.trim() || en.member.waitingUnnamed,
      color: colorForIndex(family.people.length),
      order: family.people.length,
      active: true,
    };
    dispatch({ type: 'addPerson', person });
    membership.approve(uid, person.id);
  };

  const sheets = (
    <>
      <HomeSheets
        sheet={sheet}
        family={family}
        current={current}
        account={account}
        onClose={closeSheet}
        uid={ratingUid}
        onPickDay={setDay}
        onCloseDay={() => setDay(null)}
        day={{ date: day, turns: dayTurns }}
        onRate={(turnId, rating) =>
          ratingUid && dispatch({ type: 'rateTurn', turnId, uid: ratingUid, rating })
        }
        onRemoveTurn={(turnId) => {
          // Off this phone and off the server, or the next snapshot puts it back.
          dispatch({ type: 'removeTurn', turnId });
          void deleteTurn(family.id, turnId);
        }}
        today={now()}
        onLogDay={(personId) => {
          if (!day) return;
          dispatch({ type: 'logTurn', id: newId(), madeAt: isoForDay(day), personId });
          setDay(null);
        }}
        onSwap={(personId) => {
          if (!current) return;
          closeSheet();

          const them = family.people.find((p) => p.id === personId);
          const canBeAsked = membership.answerablePersonIds.has(personId);

          // Nobody to ask: a name the owner typed in has no phone behind it, and
          // with no sync there is only this one. The owner moves the two people
          // themselves, which is what the app always did.
          if (!syncConfigured || !canBeAsked) {
            if (isOwner) {
              dispatch({ type: 'swap', aId: current.id, bId: personId });
              if (them && syncConfigured) say(en.swap.noAccount(them.name));
            }
            return;
          }

          swaps.ask(personId, nextDue(family, now()).toISOString());
          if (them) setAsked(them.name);
        }}
        orders={orders}
        onSetColor={(color) => {
          const mine = membership.me;
          if (!mine) return;
          // The owner writes the person, everyone else writes their own
          // membership entry: the rules allow each exactly one of the two.
          if (membership.state === 'owner') dispatch({ type: 'setColor', id: mine.id, color });
          else membership.setColor(color);
        }}
        onSchedule={(schedule) => dispatch({ type: 'setSchedule', schedule })}
        onToggleHoliday={(id, active) => dispatch({ type: 'setActive', id, active })}
        onEditPeople={onEditPeople}
        onApprove={approve}
        families={allFamilies(state)}
        onSwitchFamily={(id) => {
          dispatch({ type: 'switchFamily', id });
          closeSheet();
        }}
        onNewFamily={() => {
          closeSheet();
          onNewFamily();
        }}
        onStartOver={() => {
          // The asking happens in the sheet; by here it has been answered.
          void deleteFamily(family.id);
          dispatch({ type: 'reset' });
          replacePath('/');
        }}
        me={me}
        membership={membership}
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
    </>
  );

  const bar = (
    <TopBar
      schedule={family.schedule}
      onSchedule={isOwner ? () => setSheet('schedule') : undefined}
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
  // Once this week's toast is made the person on screen is next week's, so the
  // screen says so. The lever stays live: pulling it is half the point.
  const done = weekDone(family, now());
  const idle = current.id === me?.id ? en.lever.idleYou : en.lever.idle;
  const hint = flash ?? (status === 'idle' || status === 'popped' ? idle : en.lever[status]);

  return (
    <div className="device">
      {bar}

      <div className="head">
        <div className="kicker">{done ? en.home.nextUp : en.home.kicker}</div>
        <div className="big">{current.name}</div>
        <div className="sub">
          {done ? (
            en.home.dueOn(formatDayDate(nextDue(family, now())))
          ) : last ? (
            en.home.turnsSoFar(turnCounts(family)[current.id] ?? 0, formatShortDate(last.madeAt))
          ) : (
            en.home.firstTurn
          )}
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

      <OrdersButton
        slices={orders.tally.slices}
        making={Boolean(current) && current!.id === membership.me?.id}
        ordered={orders.mine !== null}
        onOpen={() => setSheet('orders')}
      />

      {/* Nothing to skip once someone has made it: the week is settled. */}
      {canLog && !done && (
        <button
          className="skip-week"
          type="button"
          onClick={() => {
            dispatch({ type: 'skipWeek', id: newId(), madeAt: nowISO() });
            setNote((n) => ({ key: n.key + 1, text: en.history.skipped }));
            setFlash(en.history.skippedHint);
            window.clearTimeout(flashTimer.current);
            flashTimer.current = window.setTimeout(() => setFlash(null), FLASH_MS);
          }}
        >
          {en.history.logSkip}
        </button>
      )}

      <Notice
        open={asked !== null}
        title={en.swap.sentTitle(asked ?? '')}
        note={en.swap.sentNote(asked ?? '')}
        closeLabel={en.swap.sentClose}
        onClose={() => setAsked(null)}
      />

      <SwapAsk
        swap={swaps.incoming}
        family={family}
        onAccept={(swap) => {
          swaps.accept(swap);
          const from = family.people.find((p) => p.id === swap.fromPersonId);
          if (from) say(isOwner ? en.swap.accepted(from.name) : en.swap.waiting);
        }}
        onDecline={swaps.decline}
      />

      <InstallHint />
      <QueueBar
        people={queue}
        slices={Object.fromEntries(
          // What is still to make, so a badge counts down as the toast comes
          // out and is gone once that person has theirs.
          orders.lines.map((line) => [
            line.person.id,
            outstanding(line.order, orders.madeFor(line.person.id)),
          ]),
        )}
        orderLabel={en.orders.wants}
        onPick={isOwner || membership.me?.id === current?.id ? () => setSheet('swap') : undefined}
        swapLabel={en.swap.title}
        nowLabel={done ? en.home.upNext : en.home.upNow}
      />
      <Note playKey={note.key} text={note.text} />

      {sheets}
    </div>
  );
}
