import { HistorySheet } from './HistorySheet';
import { SwapSheet } from './SwapSheet';
import { ScheduleSheet } from './ScheduleSheet';
import { SettingsSheet } from './SettingsSheet';
import type { Family, Person, Schedule } from '../lib/types';

export type SheetName = 'history' | 'swap' | 'schedule' | 'settings' | null;

type HomeSheetsProps = {
  sheet: SheetName;
  family: Family;
  current: Person | null;
  onClose: () => void;
  onSkip: () => void;
  onSwap: (personId: string) => void;
  onSchedule: (patch: Partial<Schedule>) => void;
  onToggleHoliday: (personId: string, active: boolean) => void;
  onEditPeople: () => void;
  onStartOver: () => void;
  onWhoAmI: () => void;
};

/** Everything that isn't the answer, gathered in one place. */
export function HomeSheets({
  sheet,
  family,
  current,
  onClose,
  onSkip,
  onSwap,
  onSchedule,
  onToggleHoliday,
  onEditPeople,
  onStartOver,
  onWhoAmI,
}: HomeSheetsProps) {
  return (
    <>
      <HistorySheet open={sheet === 'history'} family={family} onClose={onClose} onSkip={onSkip} />
      <ScheduleSheet
        open={sheet === 'schedule'}
        schedule={family.schedule}
        onClose={onClose}
        onChange={onSchedule}
      />
      <SettingsSheet
        open={sheet === 'settings'}
        family={family}
        onClose={onClose}
        onEditPeople={onEditPeople}
        onToggleHoliday={onToggleHoliday}
        onStartOver={onStartOver}
        onWhoAmI={onWhoAmI}
      />
      {current && (
        <SwapSheet
          open={sheet === 'swap'}
          family={family}
          current={current}
          onClose={onClose}
          onSwap={onSwap}
        />
      )}
    </>
  );
}
