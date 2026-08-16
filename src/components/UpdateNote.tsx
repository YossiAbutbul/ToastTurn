import { useAppUpdate } from '../hooks/useAppUpdate';
import { en } from '../i18n/en';
import './UpdateNote.css';

/**
 * The one thing that talks over whatever screen is up: a newer ToastTurn is
 * waiting. Taking it reloads, so it asks rather than doing it.
 */
/**
 * `?update` on the dev server shows the note without a deploy to trigger it.
 * Read at load, before the address bar is rewritten to the rotation, and gone
 * from a production build.
 */
const FORCED =
  import.meta.env.DEV && new URLSearchParams(window.location.search).has('update');

export function UpdateNote() {
  const { ready, update } = useAppUpdate();
  if (!ready && !FORCED) return null;

  return (
    <div className="update-note" role="status">
      <p>
        <b className="mark">
          {en.brand.first}
          <span>{en.brand.second}</span>
        </b>{' '}
        {en.update.ready}
      </p>

      <button type="button" className="update-action" onClick={update}>
        {en.update.action}
      </button>
    </div>
  );
}
