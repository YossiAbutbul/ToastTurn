/** The fixed palette people are picked from, every value is an existing token. */
export const PALETTE = [
  '#E9553D', // coral
  '#F7C548', // butter
  '#5FB99E', // mint
  '#C8862F', // crust
  '#8A5322', // toasted
  '#AFBCC4', // chrome-dk
] as const;

export function colorForIndex(index: number): string {
  return PALETTE[index % PALETTE.length];
}

/** What each one is called, for the picker's labels. */
const NAMES: Record<string, string> = {
  '#E9553D': 'Coral',
  '#F7C548': 'Butter',
  '#5FB99E': 'Mint',
  '#C8862F': 'Crust',
  '#8A5322': 'Toasted',
  '#AFBCC4': 'Chrome',
};

export function nameForColor(color: string): string {
  return NAMES[color.toUpperCase()] ?? 'Your own colour';
}
