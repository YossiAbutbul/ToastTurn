import './ToastSlice.css';

/**
 * The welcome screen's slice — the same bread the toaster pops, drawn flat and
 * a little larger. Nothing on it: this app is about whose turn it is, not
 * what goes on top.
 */
export function ToastSlice() {
  return (
    <svg className="toast-slice" viewBox="88 -6 144 146" role="img" aria-label="A slice of toast">
      <g className="ts-steam">
        <path d="M126 18 c-8-8 8-13 0-22" />
        <path d="M160 8 c-8-8 8-13 0-22" />
        <path d="M194 18 c-8-8 8-13 0-22" />
      </g>

      <ellipse className="ts-shadow" cx="160" cy="126" rx="66" ry="9" />

      {/* crust, then crumb — the toaster's own outline */}
      <path
        className="ts-crust"
        d="M102 120 V72 c0-19 11-31 28-33 4-13 21-17 31-8 10-9 27-5 29 8 19 2 28 14 28 33 v48 z"
      />
      <path
        className="ts-crumb"
        d="M111 120 V78 c0-15 9-25 23-27 3-10 17-14 26-6 8-7 21-3 26 6 14 2 23 12 23 27 v42 z"
      />
      {/* one soft catch of light along the top left, so it isn't a flat cutout */}
      <path className="ts-sheen" d="M124 76 c2-13 10-20 21-23" />
    </svg>
  );
}
