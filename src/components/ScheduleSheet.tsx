import { Sheet } from './Sheet';
import { ScheduleFields } from './ScheduleFields';
import { en } from '../i18n/en';
import type { Schedule } from '../lib/types';

type ScheduleSheetProps = {
  open: boolean;
  schedule: Schedule;
  onClose: () => void;
  onChange: (patch: Partial<Schedule>) => void;
};

/** Toast night on its own, opened from the pill that shows it. */
export function ScheduleSheet({ open, schedule, onClose, onChange }: ScheduleSheetProps) {
  return (
    <Sheet open={open} title={en.schedule.title} onClose={onClose}>
      <ScheduleFields schedule={schedule} onChange={onChange} />
    </Sheet>
  );
}
