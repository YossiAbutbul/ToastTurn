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
import { useOrders } from '../hooks/useOrders';
import { OrdersButton } from '../components/OrdersButton';
import { Notice } from '../components/Notice';
import { SignInSheet } from '../components/SignInSheet';
import { Claim } from './Claim';
import { signOut } from '../lib/auth';
import { syncConfigured } from '../lib/firebase';
import { useFamily } from '../store/useFamily';
import { allFamilies } from '../store/familyReducer';
import { en } from '../i18n/en';
import { formatShortDate, initialOf, isoForDay } from '../lib/format';
import {
  getCurrentPerson,
  getUpcoming,
  lastTurnFor,
  rotationOrder,
  turnCounts,
} from '../lib/rotation';
import { now, nowISO } from '../lib/clock';
import { newId } from '../lib/id';
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
  /** The wordmark: back to the welcome, still holding the rotation. */
  onHome: () => void;
};

export function Home({ onEditPeople, onLeave, onNewFamily, onHome }: HomeProps) {
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
  /** Whose order the sheet opens on, when the queue named somebody. */
  const [orderFocus, setOrderFocus] = useState<string | undefined>(undefined);
  /** How many "yours is made" there have been by the time you waved it away. */
  const [seenReady, setSeenReady] = useState(0);
  const flashTimer = useRef<number | undefined>(undefined);

  const orders = useOrders(family, membership.me?.id);

  useEffect(() => () => window.clearTimeout(flashTimer.current), []);

  // Somebody made yours. A card rather than the line along the bottom: the
  // phone that needs telling is the one face down on the table. Counted
  // rather than flagged, so it needs no effect to raise it.
  const toastReady = orders.ready > seenReady;

  const current = getCurrentPerson(family);
  const queue = rotationOrder(family);
  const closeSheet = () => {
    setSheet(null);
    setDay(null);
    setOrderFocus(undefined);
  };

  /** The queue along the bottom: a tap opens what that person wants. */
  const openOrder = (personId?: string) => {
    setOrderFocus(personId);
    setSheet('orders');
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
    setFlash(next ? en.lever.logged(next.name) : en.lever.loggedAlone);

    window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlash(null), FLASH_MS);
  }, [dispatch, family]);

  // A phone that has not said which person it is says so first. Nobody is
  // asked and nobody waits: the names are already there to be claimed.
  if (membership.state === 'unclaimed') {
    return (
      <Claim
        family={family}
        taken={membership.takenPersonIds}
        onClaim={membership.claim}
        onJoinAs={(name) => void membership.joinAs(name)}
      />
    );
  }

  const sheets = (
    <>
      <HomeSheets
        sheet={sheet}
        family={family}
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
        orders={orders}
        orderFocus={orderFocus}
        onSetColor={(color) => {
          const mine = membership.me;
          if (!mine) return;
          // The owner writes the person, everyone else writes their own
          // membership entry: the rules allow each exactly one of the two.
          if (membership.state === 'owner') dispatch({ type: 'setColor', id: mine.id, color });
          else membership.setColor(color);
        }}
        onToggleHoliday={(id, active) => dispatch({ type: 'setActive', id, active })}
        onAddPerson={(name, color) =>
          dispatch({
            type: 'addPerson',
            person: { id: newId(), name, color, order: family.people.length, active: true },
          })
        }
        onMovePerson={(personId, delta) => dispatch({ type: 'movePerson', id: personId, delta })}
        onRename={(name) => dispatch({ type: 'renameFamily', name })}
        onRemovePerson={(personId) => {
          // The claim goes with the person. Their phone already reads as
          // unclaimed once the name is off the list, but the entry saying it
          // was them has no one left to point at.
          for (const uid of membership.uidsForPerson(personId)) membership.remove(uid);
          // What they wanted goes too, along with anything ticked off it.
          orders.clear(personId);
          dispatch({ type: 'removePerson', id: personId });
        }}
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
        canMarkDone={canLog}
      />
      <SignInSheet open={signingIn} account={account} onClose={() => setSigningIn(false)} />
    </>
  );

  const bar = (
    <TopBar
      onHome={onHome}
      onHistory={() => setSheet('history')}
      onSettings={() => setSheet('settings')}
      onProfile={() => setSheet('profile')}
      me={me}
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

      {/* Hint, the orders button, and the quiet way out, at one height
          whatever is in it: the block must not resize under the toaster. */}
      <div className="deck">
        <div className="hint">{canLog ? hint : en.member.leverLocked}</div>

        <OrdersButton
          slices={orders.tally.slices}
          making={Boolean(current) && current!.id === membership.me?.id}
          ordered={orders.mine !== null}
          onOpen={() => openOrder()}
        />

        {canLog && (
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
      </div>

      <Notice
        open={toastReady}
        title={en.orders.readyTitle}
        note={current && current.id !== me?.id ? en.orders.readyBy(current.name) : undefined}
        closeLabel={en.orders.readyClose}
        onClose={() => setSeenReady(orders.ready)}
      />

      <InstallHint />
      <QueueBar
        people={queue}
        slices={Object.fromEntries(
          // What each person is waiting on, which goes the moment their
          // order is made and comes off the board.
          orders.lines.map((line) => [line.person.id, outstanding(line.order)]),
        )}
        orderLabel={en.orders.wants}
        onManage={isOwner ? () => setSheet('rotation') : undefined}
        manageLabel={en.settings.manageRotation}
        onPick={openOrder}
        openLabel={en.orders.openTheirs}
        nowLabel={en.home.upNow}
      />
      <Note playKey={note.key} text={note.text} />

      {sheets}
    </div>
  );
}
