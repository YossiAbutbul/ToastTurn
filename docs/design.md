# Design

[`prototype.html`](prototype.html) is the approved design, as one self-contained
file. Open it in a browser and pull the lever. Where this document is ambiguous,
the prototype is the answer — match its colours, spacing, timings and SVG
geometry exactly.

## The look

Flat cartoon illustration. 3–5px `--ink` outlines on everything. Hard
`0 2px 0 var(--ink)` shadows on anything pressable, collapsing to
`translateY(2px)` on `:active`. Generous border radii. Gradients only inside the
toaster SVG, to fake metal and depth.

## Tokens

In [`src/styles/tokens.css`](../src/styles/tokens.css). These are final; nothing
new is invented without asking.

```css
:root {
  /* surfaces */
  --sky:      #DCE7EE;  /* wall / upper background */
  --sky-2:    #CBDCE7;  /* outside the phone frame */
  --counter:  #EADFCB;  /* countertop, lower 37% of the screen */
  --paper:    #FFFDF7;  /* sheets, badges, pills */

  /* toaster */
  --coral:    #E9553D;  /* toaster body, the "next up" accent */
  --coral-lt: #F4785F;
  --coral-dk: #C93E2A;
  --chrome:   #DCE5EA;
  --chrome-dk:#AFBCC4;

  /* bread */
  --butter:   #F7C548;  /* crumb */
  --crust:    #C8862F;
  --toasted:  #8A5322;  /* crust, after toasting */
  --toasted-lt:#B4762F; /* crumb, after toasting */

  /* ink + status */
  --ink:      #2B2420;  /* every outline and all body text */
  --ink-soft: #6E635C;  /* secondary text only */
  --mint:     #5FB99E;  /* success, toggles, focus rings */
  --coil:     #FF5C22;  /* the heating element glow — nothing else */
}
```

People pick a colour from a fixed palette of six, all of them existing tokens.
See [`src/lib/palette.ts`](../src/lib/palette.ts).

## Type

**Baloo 2** (600/700/800) for names, headings and numbers. **Nunito**
(600/700/800) for labels, buttons and body.

Both are self-hosted with `@fontsource/baloo-2` and `@fontsource/nunito`. Do not
hotlink Google Fonts — it breaks offline.

## Layout

Designed at 390×844. Desktop is a centred phone-width column, not a different
design. Every interactive target is at least 44×44px and sits in the lower two
thirds of the screen, where a thumb reaches. `env(safe-area-inset-*)` on the top
bar and the bottom queue.

CSS uses logical properties throughout (`margin-inline-start`, never
`margin-left`), and lives next to its component as `Component.css`.

## The toaster

[`src/components/Toaster.tsx`](../src/components/Toaster.tsx) — a single inline
SVG, `viewBox="0 -50 340 350"`, ported from the prototype rather than redrawn.

Structure, in paint order. Later elements cover earlier ones, and that is what
makes the slice look inserted, so it must not be reordered:

1. Counter shadow ellipse
2. `<g id="sliceGrp">` — crust path, crumb path, initial letter
3. Steam squiggles
4. Body group — chrome cap, slot, coil glow, tapered body, highlight, vents,
   dial, badge, plinth, feet
5. Lever — channel, then the draggable knob group

### Animation timings

The brief asked for fast. Do not slow these down.

| Phase | Duration | What happens |
|---|---|---|
| Drag | live | Knob follows the pointer, clamped 0–46 SVG units |
| Release ≥ 65% | — | Commit. Below that, spring back |
| Toasting | 1050ms | Slice drops to `+78`, crust → `--toasted`, coils glow, dial needle spins |
| Pop | 200ms up, then it settles | Slice is thrown to `-30`, drops back to `0`, steam runs, the note appears |
| Reset | 1500ms later | Slice jumps to `+92` with no transition, recolours with no fade, next person's initial, then springs to `0` |

Slice positions: `REST = 0`, `DEEP = 78`, `HOP = -30`, coming to rest back at
`REST` — the jump is what does the popping. The slice is a whole piece of bread:
its bottom is hidden behind the chrome cap rather than cut off at it, so every
position has to keep that bottom out of sight.

### Accessibility

The lever group carries `role="button"`, `tabIndex={0}`, an `aria-label`, and
Enter/Space handling that runs the same cycle a drag does, with a `--mint` focus
ring. `prefers-reduced-motion` cuts every duration to near zero and jumps
straight to the result.

The drag maths lives in [`useLeverDrag()`](../src/hooks/useLeverDrag.ts) so the
SVG file stays declarative. Client pixels become SVG units with
`(e.clientY - rect.top) * (350 / rect.height)`.

## Voice

Plain, warm, short. The interface talks like a person setting the table, not a
system reporting status. Every string is in
[`src/i18n/en.ts`](../src/i18n/en.ts).

- Buttons say what happens: "Pull down", "Order now", "Start the rotation".
- Confirmations name the person: "Yossi did it!" — not "Turn logged successfully".
- Empty states invite: "No one's in the rotation yet. Add the first person."
- Errors say what broke and what to do: "Couldn't sync. Your turn is saved on
  this phone and will go up when you're back online." Never apologise, never say
  "oops", never show an error code.
- Sentence case everywhere except the names on the toast.

English only. A Hebrew translation and an RTL pass were dropped; the two habits
that came from that plan — logical CSS properties and one strings file — were
kept because they are worth keeping on their own.
