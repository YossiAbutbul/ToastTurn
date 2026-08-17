import { Gate } from '../components/Gate';
import { en } from '../i18n/en';

type JoiningProps = {
  /** The code from the link, so it is clear which one is being waited on. */
  code: string;
  /** Nothing came back: the code names no rotation. */
  notFound: boolean;
  onBack: () => void;
};

/**
 * Between a code and a rotation.
 *
 * It has to be a screen of its own rather than the rotation this phone
 * already had: showing that one while waiting told people they had joined
 * something they had not, and a code with nothing behind it left them looking
 * at the wrong family with no way to say so. There is always a way back, which
 * matters most where there is no address bar to retype.
 */
export function Joining({ code, notFound, onBack }: JoiningProps) {
  return (
    <Gate
      waiting={!notFound}
      kicker={en.join.opening}
      title={code}
      sub={notFound ? en.join.notFound : en.join.openingBlurb}
    >
      <button className="close" type="button" onClick={onBack}>
        {notFound ? en.join.backHome : en.join.stopWaiting}
      </button>
    </Gate>
  );
}
