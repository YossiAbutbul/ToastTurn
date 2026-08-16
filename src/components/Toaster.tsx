import { useEffect, useRef, useState } from 'react';
import { ToasterBody } from './ToasterBody';
import { useLeverDrag } from '../hooks/useLeverDrag';
import { useToastCycle } from '../hooks/useToastCycle';
import './Toaster.css';

export type ToasterStatus = 'idle' | 'pulling' | 'ready' | 'toasting' | 'popped';

type ToasterProps = {
  /** Initial letter on the slice, the person whose turn it is. */
  initial: string;
  /** Fires once per cycle, the moment the slice pops. */
  onPop: () => void;
  /** Reported on every change so the screen can update its hint line. */
  onStatus?: (status: ToasterStatus) => void;
  /** True for someone who is not in the rotation: the lever will not budge. */
  locked?: boolean;
  leverLabel: string;
};

export function Toaster({ initial, locked, onPop, onStatus, leverLabel }: ToasterProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { phase, sliceY, snap, hop, baked, needle, steamKey, start, busy } = useToastCycle({ onPop });
  const lever = useLeverDrag({ svgRef, disabled: busy || locked, onCommit: start });

  // The slice holds the current letter through the bake and the pop, then takes
  // the next person's while it is out of sight below the slot.
  const [letter, setLetter] = useState(initial);
  if ((phase === 'idle' || snap) && letter !== initial) setLetter(initial);

  const status: ToasterStatus = busy ? phase : lever.state;
  useEffect(() => onStatus?.(status), [status, onStatus]);

  const leverY = lever.dragging ? lever.offset : phase === 'toasting' ? 46 : 0;

  return (
    <svg
      ref={svgRef}
      className="toaster"
      viewBox="0 -50 340 350"
      role="img"
      aria-label={leverLabel}
    >
      <defs>
        <linearGradient id="gBody" x1="0" y1="0" x2=".5" y2="1">
          <stop offset="0" className="tt-body-0" />
          <stop offset=".45" className="tt-body-1" />
          <stop offset="1" className="tt-body-2" />
        </linearGradient>
        <linearGradient id="gChrome" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className="tt-chrome-0" />
          <stop offset=".35" className="tt-chrome-1" />
          <stop offset=".55" className="tt-chrome-2" />
          <stop offset="1" className="tt-chrome-3" />
        </linearGradient>
        <linearGradient id="gSlot" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className="tt-slot-0" />
          <stop offset="1" className="tt-slot-1" />
        </linearGradient>
        <linearGradient id="gCrust" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className="tt-crust-0" />
          <stop offset="1" className="tt-crust-1" />
        </linearGradient>
        <linearGradient id="gCrumb" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className="tt-crumb-0" />
          <stop offset="1" className="tt-crumb-1" />
        </linearGradient>
      </defs>

      <ellipse cx="168" cy="272" rx="122" ry="12" className="tt-shadow" />

      {/* ===== slice (behind body) ===== */}
      <g
        className={`tt-slice${snap ? ' tt-slice-snap' : ''}${hop ? ' tt-slice-hop' : ''}`}
        transform={`translate(0,${sliceY})`}
      >
        {/* A whole slice, not one cut off at the slot: the bottom is hidden
            behind the chrome cap at rest and has to still be there when the
            slice jumps. */}
        <path
          d="M102 140 V72 c0-19 11-31 28-33 4-13 21-17 31-8 10-9 27-5 29 8 19 2 28 14 28 33 v68 c0 7-5 12-12 12 H114 c-7 0-12-5-12-12 z"
          className={baked ? 'tt-crust tt-baked tt-ink' : 'tt-crust tt-ink'}
          strokeWidth="5"
          strokeLinejoin="round"
        />
        <path
          d="M111 132 V78 c0-15 9-25 23-27 3-10 17-14 26-6 8-7 21-3 26 6 14 2 23 12 23 27 v54 c0 6-4 10-10 10 H121 c-6 0-10-4-10-10 z"
          className={baked ? 'tt-crumb tt-baked' : 'tt-crumb'}
        />
        <text x="160" y="90" textAnchor="middle" className="tt-initial">
          {letter}
        </text>
      </g>

      <g key={steamKey} className={steamKey > 0 ? 'tt-steam tt-steam-go' : 'tt-steam'}>
        <path d="M132 -6 c-8-8 8-14 0-24" />
        <path d="M160 -16 c-8-8 8-14 0-24" />
        <path d="M188 -6 c-8-8 8-14 0-24" />
      </g>

      <ToasterBody glow={phase === 'toasting'} needle={needle} />

      {/* ===== lever ===== */}
      <rect x="286" y="134" width="20" height="88" rx="10" className="tt-channel tt-ink" strokeWidth="4.5" />
      <rect x="292" y="142" width="8" height="72" rx="4" className="tt-channel-groove" />
      <g
        className={lever.dragging ? 'tt-lever tt-lever-dragging' : 'tt-lever'}
        transform={`translate(0,${leverY})`}
        tabIndex={locked ? -1 : 0}
        role="button"
        aria-label={leverLabel}
        aria-disabled={busy || locked}
        {...lever.handlers}
      >
        {/* invisible grab area, the knob itself is smaller than a thumb */}
        <rect x="266" y="126" width="60" height="58" fill="transparent" />
        <rect x="278" y="138" width="36" height="34" rx="13" className="tt-knob tt-chrome tt-ink" strokeWidth="5" />
        <rect x="287" y="148" width="18" height="3.5" rx="1.75" className="tt-grip" />
        <rect x="287" y="155" width="18" height="3.5" rx="1.75" className="tt-grip" />
        <rect x="287" y="162" width="18" height="3.5" rx="1.75" className="tt-grip" />
      </g>

      <g className="tt-crumbs">
        <circle cx="300" cy="270" r="3" />
        <circle cx="316" cy="276" r="2.2" />
        <circle cx="38" cy="274" r="2.6" />
      </g>
    </svg>
  );
}
