import { useState } from 'react';
import { PALETTE, nameForColor } from '../lib/palette';
import { CUSTOM_SATURATION, hexToHsl, hslToHex } from '../lib/color';
import { en } from '../i18n/en';
import './ColorPicker.css';

/** Shade counts up as the colour darkens: lightness is SHADE_TOP minus it. */
const SHADE_TOP = 108;
const SHADE_MIN = 26;
const SHADE_MAX = 82;

type ColorPickerProps = {
  value: string;
  onChange: (color: string) => void;
  /** Shown on the slice so the colour is judged against a real name. */
  initial: string;
};

/**
 * The six house colours, and a pair of rails for anyone who wants their own.
 * Saturation stays put: the rails move hue and shade only, which keeps a mixed
 * colour in the same family as the palette rather than turning out neon.
 */
export function ColorPicker({ value, onChange, initial }: ColorPickerProps) {
  const known = PALETTE.includes(value as (typeof PALETTE)[number]);
  const [mixing, setMixing] = useState(!known);
  const hsl = hexToHsl(value);
  const [hue, setHue] = useState(hsl.h);
  // The rail is painted pale on one end and toasted on the other, and reads in
  // that direction: further along is darker, which is the opposite of
  // lightness. Storing the shade the way it is shown keeps the knob and the
  // paint under it in agreement.
  const [shade, setShade] = useState(SHADE_TOP - hsl.l);

  const mix = (nextHue: number, nextShade: number) => {
    setHue(nextHue);
    setShade(nextShade);
    onChange(hslToHex({ h: nextHue, s: CUSTOM_SATURATION, l: SHADE_TOP - nextShade }));
  };

  const shadeRail = `linear-gradient(to right,
    ${hslToHex({ h: hue, s: CUSTOM_SATURATION, l: SHADE_TOP - SHADE_MIN })},
    ${hslToHex({ h: hue, s: CUSTOM_SATURATION, l: SHADE_TOP - (SHADE_MIN + SHADE_MAX) / 2 })},
    ${hslToHex({ h: hue, s: CUSTOM_SATURATION, l: SHADE_TOP - SHADE_MAX })})`;

  return (
    <div className="picker">
      <div className="picker-top">
        <span className="picker-slice" style={{ background: value }}>
          {initial}
        </span>

        <div className="pick-swatches" role="group" aria-label={en.color.title}>
          {PALETTE.map((swatch) => (
            <button
              key={swatch}
              type="button"
              className={swatch === value ? 'pick-swatch on' : 'pick-swatch'}
              style={{ background: swatch }}
              aria-label={nameForColor(swatch)}
              aria-pressed={swatch === value}
              onClick={() => {
                setMixing(false);
                onChange(swatch);
              }}
            />
          ))}
        </div>
      </div>

      <button
        type="button"
        className={mixing ? 'ghost mix on' : 'ghost mix'}
        aria-expanded={mixing}
        onClick={() => setMixing((was) => !was)}
      >
        {en.color.custom}
      </button>

      {mixing && (
        <div className="rails">
          <label className="rail-row">
            <span className="rail-label">{en.color.hue}</span>
            <input
              type="range"
              className="rail hue"
              min={0}
              max={359}
              value={hue}
              onChange={(e) => mix(Number(e.target.value), shade)}
            />
          </label>

          <label className="rail-row">
            <span className="rail-label">{en.color.shade}</span>
            <input
              type="range"
              className="rail"
              style={{ background: shadeRail }}
              min={SHADE_MIN}
              max={SHADE_MAX}
              value={shade}
              onChange={(e) => mix(hue, Number(e.target.value))}
            />
          </label>
        </div>
      )}
    </div>
  );
}
