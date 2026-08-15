import './ToastSlice.css';

/**
 * The welcome screen's mascot: one slice of bread, front on, symmetrical.
 *
 * Chunky and slightly wider than it is tall, with a heavy outline, a thick
 * crust border and a paler middle. The dome is three equal arcs, so the humps
 * sit even — hand-drawn curves came out lopsided. No face.
 */
export function ToastSlice() {
  return (
    <svg className="toast-slice" viewBox="24 40 192 184" role="img" aria-label="A slice of toast">
      <defs>
        <clipPath id="tsCrust">
          <path
            d="M36 186 V80 A28 28 0 0 1 92 80 A28 28 0 0 1 148 80 A28 28 0 0 1 204 80
               V186 C204 195 196 202 186 202 H54 C44 202 36 195 36 186 Z"
          />
        </clipPath>
      </defs>

      <ellipse className="ts-shadow" cx="120" cy="210" rx="70" ry="8" />

      <path
        className="ts-crust"
        d="M36 186 V80 A28 28 0 0 1 92 80 A28 28 0 0 1 148 80 A28 28 0 0 1 204 80
           V186 C204 195 196 202 186 202 H54 C44 202 36 195 36 186 Z"
      />
      {/* the crust sits deeper in shade towards the bottom */}
      <rect className="ts-crust-shade" clipPath="url(#tsCrust)" x="24" y="158" width="192" height="56" />

      <path
        className="ts-crumb"
        d="M56 172 V92 A21 21 0 0 1 98 92 A22 22 0 0 1 142 92 A21 21 0 0 1 184 92
           V172 C184 179 179 182 172 182 H68 C61 182 56 179 56 172 Z"
      />
      {/* a lighter middle, so the crumb is not one flat colour — a soft centre
          rather than a second dome, which read as another layer of bread */}
      <ellipse className="ts-crumb-light" cx="120" cy="126" rx="56" ry="46" />

      <g className="ts-speckle">
        <circle cx="152" cy="118" r="2.4" />
        <circle cx="160" cy="130" r="1.6" />
        <circle cx="80" cy="156" r="2.1" />
        <circle cx="89" cy="166" r="1.4" />
      </g>
    </svg>
  );
}
