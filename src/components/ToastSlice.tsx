import './ToastSlice.css';

/**
 * The welcome screen's slice, front on and symmetrical.
 *
 * Two things decide whether it reads as bread: the top is a little wider than
 * the body and eases into it — straight sides look like a brick, a hard step
 * looks like a crown — and the humps are shallow. They are drawn as arcs with
 * a radius well over half their chord, which keeps them even and gentle.
 */
export function ToastSlice() {
  const outline =
    'M47 274 C47 230 44 190 42 150 A42 42 0 0 1 97 150 A44 44 0 0 1 152 150 ' +
    'A42 42 0 0 1 207 150 C205 190 202 230 202 274 C202 284 194 290 183 290 ' +
    'H66 C55 290 47 284 47 274 Z';

  return (
    <svg className="toast-slice" viewBox="28 122 194 190" role="img" aria-label="A slice of toast">
      <defs>
        <clipPath id="tsCrust">
          <path d={outline} />
        </clipPath>
      </defs>

      <ellipse className="ts-shadow" cx="124" cy="298" rx="68" ry="8" />

      <path className="ts-crust" d={outline} />
      {/* the crust sits deeper in shade towards the bottom */}
      <rect className="ts-crust-shade" clipPath="url(#tsCrust)" x="28" y="242" width="200" height="64" />

      {/* crumb, following the same silhouette a crust's width in */}
      <path
        className="ts-crumb"
        d="M65 272 C65 232 62 196 60 158 A34 34 0 0 1 102 158 A36 36 0 0 1 146 158
           A34 34 0 0 1 188 158 C186 196 184 232 184 272 C184 278 180 281 174 281
           H75 C69 281 65 278 65 272 Z"
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
