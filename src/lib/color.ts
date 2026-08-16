/**
 * Just enough colour maths for the picker: the rails think in hue and
 * lightness, everything stored thinks in hex.
 */

/** Saturation is held steady so a mixed colour still belongs with the rest. */
export const CUSTOM_SATURATION = 62;

export type Hsl = { h: number; s: number; l: number };

const clamp = (value: number, low: number, high: number) =>
  Math.min(high, Math.max(low, value));

export function isHex(value: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(value);
}

export function hslToHex({ h, s, l }: Hsl): string {
  const hue = ((h % 360) + 360) % 360;
  const sat = clamp(s, 0, 100) / 100;
  const light = clamp(l, 0, 100) / 100;

  const c = (1 - Math.abs(2 * light - 1)) * sat;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = light - c / 2;

  const [r, g, b] =
    hue < 60 ? [c, x, 0]
    : hue < 120 ? [x, c, 0]
    : hue < 180 ? [0, c, x]
    : hue < 240 ? [0, x, c]
    : hue < 300 ? [x, 0, c]
    : [c, 0, x];

  const byte = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, '0');

  return `#${byte(r)}${byte(g)}${byte(b)}`.toUpperCase();
}

export function hexToHsl(hex: string): Hsl {
  if (!isHex(hex)) return { h: 20, s: CUSTOM_SATURATION, l: 58 };

  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const span = max - min;
  const l = (max + min) / 2;

  if (span === 0) return { h: 0, s: 0, l: Math.round(l * 100) };

  const s = span / (1 - Math.abs(2 * l - 1));
  const h =
    max === r ? ((g - b) / span) % 6
    : max === g ? (b - r) / span + 2
    : (r - g) / span + 4;

  return {
    h: Math.round((((h * 60) % 360) + 360) % 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}
