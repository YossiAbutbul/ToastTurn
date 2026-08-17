import { HistorySheet } from './HistorySheet';
import { OrdersSheet } from './OrdersSheet';
import { SettingsSheet } from './SettingsSheet';
import { ScheduleSheet } from './ScheduleSheet';
import { DaySheet } from './DaySheet';
import type { Account } from '../lib/auth';
import type { MembershipState } from '../hooks/useMembership';
import type { Order, OrderLine, OrderTally } from '../lib/orders';
import type { Family, Person, Schedule, Turn } from '../lib/types';

export type SheetName = 'history' | 'settings' | 'schedule' | 'orders' | null;

type HomeSheetsProps = {
  sheet: SheetName;
  family: Family;
  account: Account | null;
  onClose: () => void;
  onRate: (turnId: string, rating: number) => void;
  /** Owner only: take a turn back off the board. */
  onRemoveTurn: (turnId: string) => void;
  /** Owner only: log a day the family forgot at the time. */
  onLogDay: (personId: string) => void;
  today: Date;
  onPickDay: (date: Date) => void;
  onCloseDay: () => void;
  day: { date: Date | null; turns: Turn[] };
  /** The account doing the rating, if anyone is signed in. */
  uid?: string;
  /** Your own colour, however this phone is allowed to write it. */
  onSetColor: (color: string) => void;
  /** What everyone wants, and the one line this phone may write. */
  orders: {
    lines: OrderLine[];
    tally: OrderTally;
    mine: Order | null;
    canOrderFor: (personId: string) => boolean;
    madeFor: (personId: string) => number[];
    setMade: (personId: string, index: number) => void;
    clear: (personId: string) => void;
    set: (personId: string, choice: Omit<Order, 'personId' | 'updatedAt'>) => void;
  };
  /** Whose order the orders sheet opens on, when the queue named somebody. */
  orderFocus?: string;
  onSchedule: (patch: Partial<Schedule>) => void;
  onToggleHoliday: (personId: string, active: boolean) => void;
  onEditPeople: () => void;
  onStartOver: () => void;
  onApprove: (uid: string, name: string) => void;
  /** Every rotation this phone is in, the open one first. */
  families: Family[];
  onSwitchFamily: (id: string) => void;
  onNewFamily: () => void;
  me: Person | null;
  membership: MembershipState;
  onSignIn: () => void;
  onSignOut: () => void;
  isOwner: boolean;
};

/** Everything that isn't the answer, gathered in one place. */
export function HomeSheets(props: HomeSheetsProps) {
  const { family, sheet, isOwner, onClose } = props;

  return (
    <>
      <HistorySheet
        open={sheet === 'history'}
        family={family}
        onClose={onClose}
        onRate={props.onRate}
        onPickDay={props.onPickDay}
        uid={props.uid}
        covered={props.day.date !== null}
      />

      <DaySheet
        open={props.day.date !== null}
        family={family}
        date={props.day.date}
        turns={props.day.turns}
        uid={props.uid}
        onClose={props.onCloseDay}
        onRate={props.onRate}
        isOwner={isOwner}
        onRemove={props.onRemoveTurn}
        onLog={props.onLogDay}
        today={props.today}
      />

      {isOwner && (
        <ScheduleSheet
          open={sheet === 'schedule'}
          schedule={family.schedule}
          onClose={onClose}
          onChange={props.onSchedule}
        />
      )}

      <OrdersSheet
        open={sheet === 'orders'}
        onClose={onClose}
        lines={props.orders.lines}
        me={props.me}
        canOrderFor={props.orders.canOrderFor}
        madeFor={props.orders.madeFor}
        onTick={props.orders.setMade}
        onClear={props.orders.clear}
        onSet={props.orders.set}
        focus={props.orderFocus}
      />

      <SettingsSheet
        open={sheet === 'settings'}
        family={family}
        account={props.account}
        onClose={onClose}
        me={props.me}
        membership={props.membership}
        onSignIn={props.onSignIn}
        onSignOut={props.onSignOut}
        onSetColor={props.onSetColor}
        onToggleHoliday={props.onToggleHoliday}
        onEditPeople={props.onEditPeople}
        onStartOver={props.onStartOver}
        onApprove={props.onApprove}
        families={props.families}
        onSwitchFamily={props.onSwitchFamily}
        onNewFamily={props.onNewFamily}
        isOwner={isOwner}
      />
    </>
  );
}
