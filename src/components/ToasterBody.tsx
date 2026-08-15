type ToasterBodyProps = {
  /** Coils lit while toasting. */
  glow: boolean;
  /** Dial needle rotation, in degrees. */
  needle: number;
};

/**
 * The static half of the toaster: chrome cap, slot, coils, body, dial, badge,
 * plinth, feet. Geometry ported from docs/prototype.html — do not redraw, and
 * do not reorder: the slice is painted before this group so it reads as
 * inserted into the slot.
 */
export function ToasterBody({ glow, needle }: ToasterBodyProps) {
  return (
    <g id="bodyGrp">
      {/* top chrome cap */}
      <rect x="62" y="102" width="200" height="28" rx="14" className="tt-chrome tt-ink" strokeWidth="5" />
      <rect x="72" y="108" width="180" height="4" rx="2" className="tt-shine" />

      {/* slot */}
      <rect x="96" y="108" width="132" height="15" rx="7.5" className="tt-slot" />
      <g className={glow ? 'tt-glow tt-glow-on' : 'tt-glow'}>
        <rect x="100" y="111" width="124" height="3" rx="1.5" className="tt-coil tt-glowline" />
        <rect x="100" y="117" width="124" height="3" rx="1.5" className="tt-coil-2 tt-glowline" />
      </g>

      {/* tapered body */}
      <path
        d="M58 250 C46 250 42 240 44 226 L50 152 C52 134 64 126 80 126 L244 126 C260 126 272 134 274 152 L280 226 C282 240 278 250 266 250 Z"
        className="tt-body tt-ink"
        strokeWidth="5"
        strokeLinejoin="round"
      />

      {/* highlight */}
      <path
        d="M68 236 C62 200 66 164 74 142"
        className="tt-highlight"
        strokeWidth="9"
        strokeLinecap="round"
        fill="none"
      />

      {/* vents */}
      <g className="tt-vents">
        <rect x="232" y="160" width="26" height="5" rx="2.5" />
        <rect x="234" y="174" width="26" height="5" rx="2.5" />
        <rect x="236" y="188" width="26" height="5" rx="2.5" />
      </g>

      {/* dial */}
      <circle cx="98" cy="196" r="27" className="tt-chrome tt-ink" strokeWidth="5" />
      <circle cx="98" cy="196" r="18" className="tt-dial-face tt-ink" strokeWidth="2.5" />
      <g className="tt-ticks" strokeWidth="2.5" strokeLinecap="round">
        <line x1="98" y1="174" x2="98" y2="179" />
        <line x1="83" y1="181" x2="86" y2="184" />
        <line x1="113" y1="181" x2="110" y2="184" />
        <line x1="79" y1="196" x2="84" y2="196" />
        <line x1="117" y1="196" x2="112" y2="196" />
      </g>
      <g transform={`rotate(${needle} 98 196)`}>
        <line x1="98" y1="196" x2="98" y2="182" className="tt-needle" strokeWidth="5" strokeLinecap="round" />
      </g>
      <circle cx="98" cy="196" r="5.5" className="tt-ink-fill" />

      {/* badge */}
      <rect x="146" y="180" width="108" height="32" rx="16" className="tt-badge tt-ink" strokeWidth="4.5" />
      <text x="200" y="202" textAnchor="middle" className="tt-badge-text" letterSpacing="1.2">
        TOASTTURN
      </text>

      {/* base plinth */}
      <rect x="46" y="238" width="234" height="20" rx="10" className="tt-chrome tt-ink" strokeWidth="5" />
      <rect x="72" y="258" width="28" height="10" rx="5" className="tt-ink-fill" />
      <rect x="226" y="258" width="28" height="10" rx="5" className="tt-ink-fill" />
    </g>
  );
}
