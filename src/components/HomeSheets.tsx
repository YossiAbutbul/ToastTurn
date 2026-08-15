import { HistorySheet } from './HistorySheet';
import { SwapSheet } from './SwapSheet';
import { SettingsSheet } from './SettingsSheet';
import type { Account } from '../lib/auth';
import type { MembershipState } from '../hooks/useMembership';
import type { Family, Person, Schedule } from '../lib/types';

export type SheetName = 'history' | 'swap' | 'settings' | null;

type HomeSheetsProps = {
  sheet: SheetName;
  family: Family;
  current: Person | null;
  account: Account | null;
  onClose: () => void;
  onSkip: () => void;
  onRate: (turnId: string, rating: number) => void;
  onSwap: (personId: string) => void;
  onSchedule: (patch: Partial<Schedule>) => void;
  onToggleHoliday: (personId: string, active: boolean) => void;
  onEditPeople: () => void;
  onStartOver: () => void;
  me: Person | null;
  membership: MembershipState;
  onClaim: () => void;
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
        onSkip={props.onSkip}
        onRate={props.onRate}
      />

      <SettingsSheet
        open={sheet === 'settings'}
        family={family}
        account={props.account}
        onClose={onClose}
        me={props.me}
        membership={props.membership}
        onClaim={props.onClaim}
        onSignIn={props.onSignIn}
        onSignOut={props.onSignOut}
        onSchedule={props.onSchedule}
        onToggleHoliday={props.onToggleHoliday}
        onEditPeople={props.onEditPeople}
        onStartOver={props.onStartOver}
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
