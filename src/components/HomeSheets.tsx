import { HistorySheet } from './HistorySheet';
import { SwapSheet } from './SwapSheet';
import { SettingsSheet } from './SettingsSheet';
import { ScheduleSheet } from './ScheduleSheet';
import { DaySheet } from './DaySheet';
import type { Account } from '../lib/auth';
import type { MembershipState } from '../hooks/useMembership';
import type { Family, Person, Schedule, Turn } from '../lib/types';

export type SheetName = 'history' | 'swap' | 'settings' | 'schedule' | null;

type HomeSheetsProps = {
  sheet: SheetName;
  family: Family;
  current: Person | null;
  account: Account | null;
  onClose: () => void;
  onRate: (turnId: string, rating: number) => void;
  onPickDay: (date: Date) => void;
  onCloseDay: () => void;
  day: { date: Date | null; turns: Turn[] };
  /** The account doing the rating, if anyone is signed in. */
  uid?: string;
  onSwap: (personId: string) => void;
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
  const { family, sheet, current, isOwner, onClose } = props;

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
      />

      {isOwner && (
        <ScheduleSheet
          open={sheet === 'schedule'}
          schedule={family.schedule}
          onClose={onClose}
          onChange={props.onSchedule}
        />
      )}

      <SettingsSheet
        open={sheet === 'settings'}
        family={family}
        account={props.account}
        onClose={onClose}
        me={props.me}
        membership={props.membership}
        onSignIn={props.onSignIn}
        onSignOut={props.onSignOut}
        onToggleHoliday={props.onToggleHoliday}
        onEditPeople={props.onEditPeople}
        onStartOver={props.onStartOver}
        onApprove={props.onApprove}
        families={props.families}
        onSwitchFamily={props.onSwitchFamily}
        onNewFamily={props.onNewFamily}
        isOwner={isOwner}
      />

      {current && isOwner && (
        <SwapSheet
          open={sheet === 'swap'}
          family={family}
          current={current}
            onClose={onClose}
          onSwap={props.onSwap}
        />
      )}
    </>
  );
}
