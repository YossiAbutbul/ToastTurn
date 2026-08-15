import './CheeseToast.css';

/**
 * The welcome screen's toastie: two halves, one leaning on the other, cut so
 * the cheese and tomato show. Depth comes from stacked flat shapes and side
 * faces rather than gradients — the toaster keeps that trick to itself.
 */
export function CheeseToast() {
  return (
    <svg className="cheese-toast" viewBox="16 28 300 200" role="img" aria-label="A toasted cheese and tomato sandwich">
      <defs>
        <clipPath id="ctLeaning">
          <path d="M158 196 L214 58 L292 186 Z" />
        </clipPath>
        <clipPath id="ctLidTop">
          <path d="M30 132 C34 116 52 108 74 106 L166 100 C186 99 196 106 194 118 L190 138 L32 150 Z" />
        </clipPath>
      </defs>

      <g className="ct-steam">
        <path d="M120 66 c-9-9 9-15 0-25" />
        <path d="M232 40 c-9-9 9-15 0-25" />
      </g>

      {/* ---- the half standing up, behind ---- */}
      <g>
        {/* the far side of the slice, giving it thickness */}
        <path className="ct-bread-side" d="M170 198 L226 60 L304 188 Z" />
        {/* the grilled face */}
        <path className="ct-bread-face" d="M158 196 L214 58 L292 186 Z" />
        <g className="ct-grill" clipPath="url(#ctLeaning)">
          <path d="M120 120 L300 66" />
          <path d="M130 148 L310 94" />
          <path d="M140 176 L320 122" />
          <path d="M150 204 L330 150" />
        </g>
        <path className="ct-crumbs" d="M214 58 L292 186" />
      </g>

      {/* ---- the half lying down, in front ---- */}
      <g>
        {/* bottom slice */}
        <path
          className="ct-bread-cut"
          d="M28 178 C26 192 36 200 52 199 L176 192 C192 191 198 184 196 174 L194 164 L30 172 Z"
        />
        {/* a drip of cheese over the front edge, drawn first so it tucks under */}
        <path className="ct-cheese" d="M62 158 q9 8 9 20 q0 10 -9 10 q-9 0 -9 -10 q0 -12 9 -20 z" />

        {/* the filling itself, thick and sagging */}
        <path
          className="ct-cheese"
          d="M30 170 L194 162 L196 136 C186 144 178 134 168 140 C158 146 150 134 140 140
             C130 146 122 134 112 140 C102 146 94 134 84 140 C74 146 66 134 56 140
             C46 146 38 134 30 142 Z"
        />
        <path className="ct-tomato" d="M60 156 C72 148 94 148 104 156 C94 166 70 166 60 156 Z" />
        <path className="ct-tomato" d="M122 150 C134 142 156 142 166 150 C156 160 132 160 122 150 Z" />

        {/* top slice, grilled */}
        <path
          className="ct-bread-face"
          d="M30 132 C34 116 52 108 74 106 L166 100 C186 99 196 106 194 118 L190 138 L32 150 Z"
        />
        <g className="ct-grill" clipPath="url(#ctLidTop)">
          <path d="M52 96 L44 158" />
          <path d="M86 94 L78 156" />
          <path d="M120 92 L112 154" />
          <path d="M154 90 L146 152" />
        </g>
        {/* the cut edge of the top slice, catching the light */}
        <path className="ct-crust-edge" d="M30 140 L194 132" />
      </g>

      <ellipse className="ct-shadow" cx="168" cy="212" rx="132" ry="14" />
    </svg>
  );
}
