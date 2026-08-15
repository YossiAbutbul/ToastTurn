/** The fixed palette people are picked from — every value is an existing token. */
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
