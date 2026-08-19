/**
 * The key to a rotation, drawn like everything else here: no fill, an ink
 * outline, round ends. Colour and size come from whatever it sits in.
 *
 * It has its own class rather than only a tag, because the button it lives in
 * turns it: the shaft points along the x-axis and the bit hangs off the end,
 * so a rotation about the middle reads as a key turning in a lock.
 */
export function KeyIcon() {
  return (
    <svg className="keyicon" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="7.5" cy="12" r="4" />
      <path d="M11.5 12 H21" />
      <path d="M17 12 V15.5" />
      <path d="M20.5 12 V16.5" />
    </svg>
  );
}
