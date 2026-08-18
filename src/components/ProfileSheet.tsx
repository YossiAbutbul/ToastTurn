import { Sheet } from './Sheet';
import { SettingsYou } from './SettingsYou';
import { en } from '../i18n/en';
import type { Account } from '../lib/auth';
import type { Person } from '../lib/types';

type ProfileSheetProps = {
  open: boolean;
  onClose: () => void;
  account: Account | null;
  /** Which person in the rotation this phone said it is. */
  me: Person | null;
  isOwner: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
  onSetColor: (color: string) => void;
};

/**
 * You: your name here, the colour you go by, and the account behind it.
 *
 * It sat at the top of the settings, above the rotations and the share code,
 * which made one sheet answer two questions. Changing your own colour is not
 * an administrative act, so it has its own way in.
 */
export function ProfileSheet({ open, onClose, ...you }: ProfileSheetProps) {
  return (
    <Sheet open={open} title={en.profile.title} onClose={onClose}>
      <SettingsYou {...you} />
    </Sheet>
  );
}
