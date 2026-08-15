import './ToastSlice.css';

/**
 * The welcome screen's slice, front on and symmetrical: straight sides, and a
 * domed top of three humps sitting on the same width.
 *
 * The humps are arcs whose radius is well over half their chord, so they stay
 * shallow and even — hand-drawn curves came out lopsided, and semicircles came
 * out looking like a crown.
 */
export function ToastSlice() {
  const outline =
    'M46 274 V150 A40 40 0 0 1 98 150 A42 42 0 0 1 150 150 A40 40 0 0 1 202 150 ' +
    'V274 C202 284 194 290 183 290 H65 C54 290 46 284 46 274 Z';

  return (
    <svg className="toast-slice" viewBox="28 96 194 216" role="img" aria-label="A slice of toast">
      <defs>
        <clipPath id="tsCrust">
          <path d={outline} />
        </clipPath>
      </defs>

      {/* steam, because the toast is fresh out */}
      <g className="ts-steam">
        <path d="M96 134 c-8-8 8-14 0-22" />
        <path d="M124 126 c-8-8 8-14 0-22" />
        <path d="M152 134 c-8-8 8-14 0-22" />
      </g>

      <ellipse className="ts-shadow" cx="124" cy="298" rx="68" ry="8" />

      <path className="ts-crust" d={outline} />
      {/* the crust sits deeper in shade towards the bottom */}
      <rect className="ts-crust-shade" clipPath="url(#tsCrust)" x="28" y="242" width="200" height="64" />

      {/* crumb, following the same silhouette a crust's width in */}
      <path
        className="ts-crumb"
        d="M64 272 V158 A31 31 0 0 1 104 158 A33 33 0 0 1 144 158 A31 31 0 0 1 184 158
           V272 C184 278 180 281 174 281 H74 C68 281 64 278 64 272 Z"
      />
      {/* a soft light in the middle of the crumb */}
      <ellipse className="ts-crumb-light" cx="124" cy="216" rx="46" ry="40" />

      <g className="ts-speckle">
        <circle cx="156" cy="188" r="2.4" />
        <circle cx="163" cy="199" r="1.6" />
        <circle cx="88" cy="244" r="2.1" />
        <circle cx="96" cy="253" r="1.4" />
      </g>
    </svg>
  );
}
