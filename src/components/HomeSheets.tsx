import { HistorySheet } from './HistorySheet';
import { SwapSheet } from './SwapSheet';
import { SettingsSheet } from './SettingsSheet';
import type { Account } from '../lib/auth';
import type { Family, Person, Schedule } from '../lib/types';

export type SheetName = 'history' | 'swap' | 'settings' | null;

type HomeSheetsProps = {
  sheet: SheetName;
  family: Family;
  current: Person | null;
  me: Person | null;
  myColor: string;
  account: Account | null;
  colorOf: (person: Person) => string;
  onClose: () => void;
  onSkip: () => void;
  onSwap: (personId: string) => void;
  onSchedule: (patch: Partial<Schedule>) => void;
  onToggleHoliday: (personId: string, active: boolean) => void;
  onEditPeople: () => void;
  onStartOver: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
  onPickColor: (color: string) => void;
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
      />

      <SettingsSheet
        open={sheet === 'settings'}
        family={family}
        me={props.me}
        myColor={props.myColor}
        account={props.account}
        colorOf={props.colorOf}
        onClose={onClose}
        onPickColor={props.onPickColor}
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
          colorOf={props.colorOf}
          onClose={onClose}
          onSwap={props.onSwap}
        />
      )}
    </>
  );
}
