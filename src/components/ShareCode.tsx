import { useRef, useState } from 'react';
import { en } from '../i18n/en';
import { linkForFamily } from '../lib/url';
import './ShareCode.css';

type ShareCodeProps = {
  /** The code that goes in the link, and that someone can type instead. */
  familyId: string;
};

type Copied = 'link' | 'code' | null;

/**
 * Two ways to hand the rotation over: the link, or the code read out of it.
 *
 * The code is shown rather than hidden inside the link, because someone
 * standing in the kitchen would rather type eight characters than be sent a
 * message. Tapping it copies it; if the clipboard is not allowed, it selects
 * itself so it can be copied by hand.
 */
export function ShareCode({ familyId }: ShareCodeProps) {
  const [copied, setCopied] = useState<Copied>(null);
  const codeRef = useRef<HTMLSpanElement>(null);

  const copy = async (text: string, which: Exclude<Copied, null>) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
    } catch {
      // No clipboard: an old browser, or a page the phone does not think is
      // secure. Select it instead so a long press can still take it.
      const node = codeRef.current;
      if (!node) return;
      const range = document.createRange();
      range.selectNodeContents(node);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  };

  return (
    <>
      <button
        className="ghost primary"
        type="button"
        onClick={() => void copy(linkForFamily(window.location.origin, familyId), 'link')}
      >
        {copied === 'link' ? en.settings.shared : en.settings.share}
      </button>

      <p className="empty share-or">{en.settings.orCode}</p>

      <button
        className="codebtn"
        type="button"
        aria-label={en.settings.copyCode}
        onClick={() => void copy(familyId, 'code')}
      >
        {/* A code is a code in every language, so it stays left to right. */}
        <span className="code" dir="ltr" ref={codeRef}>
          {familyId}
        </span>
        <span className="code-do">{copied === 'code' ? en.settings.codeCopied : en.settings.copyCode}</span>
      </button>
    </>
  );
}
