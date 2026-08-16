import { en } from '../i18n/en';

type WordmarkProps = {
  /** Given a destination it becomes a button, the way a logo usually is. */
  onClick?: () => void;
};

/** The name in the corner, and the way home from wherever you are. */
export function Wordmark({ onClick }: WordmarkProps) {
  const inside = (
    <>
      {en.brand.first}
      <span>{en.brand.second}</span>
    </>
  );

  if (!onClick) return <div className="mark">{inside}</div>;

  return (
    <button className="mark markbtn" type="button" aria-label={en.brand.home} onClick={onClick}>
      {inside}
    </button>
  );
}
