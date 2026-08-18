/**
 * The bin, drawn the way everything else here is: no fill, an ink outline,
 * round ends. Colour and size come from whatever row it sits in.
 */
export function BinIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h16" />
      <path d="M10 4h4" />
      <path d="M6.5 7l1 12.5h9l1-12.5" />
      <path d="M10 10.5v6M14 10.5v6" />
    </svg>
  );
}
