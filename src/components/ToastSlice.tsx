import './ToastSlice.css';

/**
 * The welcome screen's slice: a full sandwich-loaf shape — domed top, square
 * shoulders, crust ring around a pale crumb. Bigger and simpler than the one
 * the toaster pops, because here it is the only thing on the screen.
 *
 * The dome is three arcs rather than hand-drawn curves, so the bumps are even.
 */
export function ToastSlice() {
  return (
    <svg className="toast-slice" viewBox="40 62 160 168" role="img" aria-label="A slice of toast">
      <ellipse className="ts-shadow" cx="120" cy="212" rx="64" ry="9" />

      <path
        className="ts-crust"
        d="M56 190 V100 A21 21 0 0 1 98 100 A23 23 0 0 1 144 100 A20 20 0 0 1 184 100
           V190 C184 200 176 206 166 206 H74 C64 206 56 200 56 190 Z"
      />

      <path
        className="ts-crumb"
        d="M70 186 V104 A16 16 0 0 1 102 104 A18 18 0 0 1 138 104 A16 16 0 0 1 170 104
           V186 C170 192 166 194 160 194 H80 C74 194 70 192 70 186 Z"
      />

      {/* the top of the crumb, where the heat reached it less */}
      <path
        className="ts-crumb-light"
        d="M70 140 V104 A16 16 0 0 1 102 104 A18 18 0 0 1 138 104 A16 16 0 0 1 170 104
           V140 C150 152 90 152 70 140 Z"
      />

      {/* a few crumbs baked into it */}
      <g className="ts-speckle">
        <circle cx="150" cy="112" r="2.4" />
        <circle cx="158" cy="124" r="1.7" />
        <circle cx="86" cy="160" r="2.1" />
        <circle cx="95" cy="170" r="1.5" />
      </g>
    </svg>
  );
}
