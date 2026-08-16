# ToastTurn

A tiny PWA that answers one question: **whose turn is it to make toast this week?**

Built for one family, used on phones, opened for about eight seconds at a time.
The whole point is ending the weekly argument, so the answer must be visible
without tapping, scrolling, or logging in.

---

## Non-negotiables

Read these before making any architectural decision. If a choice conflicts with
one of these, the constraint wins.

1. **Mobile-first, and that's not a slogan.** Design at 390×844. Desktop is a
   centred phone-width column. Every interactive target is at least 44×44px and
   sits in the lower two thirds of the screen.
2. **Identity, as of phase 3.** The original rule was "no accounts, no
   passwords, no email"; the family code in the URL plus a "who am I" choice on
   the device was the whole system. That was replaced on the owner's
   instruction. Logging toast still needs nothing: open the link, pull the
   lever. Signing in — Google, or an email and password — is what makes a toast
   yours: the rotation stores each person's email, so a signed-in phone matches
   itself to a person and their colour follows them to any device. The account
   that creates a rotation owns it, and is the only one the server lets change
   people, the schedule or the order.
3. **Works offline.** Opening the app on the kitchen wifi dead-spot must still
   show whose turn it is. Writes queue and sync when back online.
4. **The main screen answers the question with zero taps.** Everything else —
   history, swapping, settings — is behind a control.
5. **English only.** A Hebrew translation and an RTL pass were dropped by the
   owner on 16 Aug 2026: the app ships in English and stays that way. The two
   habits that came from that plan are worth keeping anyway, and the codebase
   already follows them throughout, so leave them alone: logical CSS
   properties (`margin-inline-start`, not `margin-left`), and every
   user-facing string in `src/i18n/en.ts` rather than loose in JSX.

---

## Stack

| Concern | Choice | Why |
|---|---|---|
| Framework | React 18 + TypeScript | Mature PWA tooling; the app is tiny so anything works, but pick one and stay |
| Build | Vite | Fast, and `vite-plugin-pwa` handles the manifest and service worker |
| Styling | Plain CSS with custom properties, one file per component | The design is bespoke SVG and hand-tuned tokens. A utility framework would fight it |
| State | React context + `useReducer` in `src/store/` | Five people and a queue. Redux/Zustand is overkill |
| Persistence (phase 1) | `localStorage`, wrapped in `src/lib/storage.ts` | Never call `localStorage` directly from a component |
| Persistence (phase 3) | Firebase Firestore (web SDK, no auth) | Free tier, realtime listeners, and its persistent cache queues offline writes for us |
| Hosting | Netlify or Vercel, static | Push to main, deploy |
| Tests | Vitest for the rotation logic only | Do not chase coverage on UI |

Do **not** add: a router library (there are two screens, use state), a UI
component library, a date library heavier than `date-fns`, an animation library
(CSS transitions and `requestAnimationFrame` are enough), or an ORM.

---

## Design tokens

These are final. Take them from `docs/prototype.html` and put them in
`src/styles/tokens.css`. Do not invent new colours; if something needs a new
value, ask first.

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

**Type.** Baloo 2 (600/700/800) for names, headings and numbers. Nunito
(600/700/800) for labels, buttons and body. Self-host both with
`@fontsource/baloo-2` and `@fontsource/nunito` — do not hotlink Google Fonts, it
breaks the offline requirement.

**The look.** Flat cartoon illustration with 3–5px `--ink` outlines on
everything, `0 2px 0 var(--ink)` hard shadows on pressable elements (which
collapse to `translateY(2px)` on `:active`), generous border radii, and gradients
only inside the toaster SVG to fake metal and depth.

---

## Screens

There are two, plus bottom sheets.

### Home (`src/screens/Home.tsx`)

```
┌──────────────────────────────┐
│ ToastTurn   [Sun · 8:00 PM]  │  ← schedule pill opens the editor
│             [History]        │
├──────────────────────────────┤
│      THIS WEEK IT'S          │
│           MAYA               │  ← Baloo 2 800, ~56px, --coral
│   4 turns so far · Aug 9     │
│                              │
│        ┌──────────┐          │
│        │  slice   │          │  ← <Toaster />, the whole illustration
│        │ ╔══════╗ │  ▓ lever │
│        │ ║ body ║ │          │
│        └──────────┘          │
│                              │
│  Pull the lever when done    │
│                              │
│   [A] [N] [T] [B]            │  ← queue, next-up in coral
└──────────────────────────────┘
```

### Setup (`src/screens/Setup.tsx`)

Shown when there is no family in storage. Family name, then add people one at a
time with a name and a colour. Reorder by dragging. "Start the rotation" writes
the family and lands on Home. This screen is reachable later from settings.

---

## The toaster component

`src/components/Toaster.tsx` — a single inline SVG, `viewBox="0 -50 340 350"`.
Port it from `docs/prototype.html` rather than redrawing it.

Structure, in paint order (later elements cover earlier ones — this is what makes
the slice look inserted, so do not reorder):

1. Counter shadow ellipse
2. `<g id="sliceGrp">` — crust path, crumb path, initial letter
3. Steam squiggles
4. Body group — chrome cap, slot, coil glow, tapered body, highlight, vents,
   dial, badge, plinth, feet
5. Lever — channel, then draggable knob group

**Animation timings.** The user asked for fast. Do not slow these down.

| Phase | Duration | What happens |
|---|---|---|
| Drag | live | Knob follows the pointer, clamped 0–46 SVG units |
| Release ≥ 65% | — | Commit. Below that, spring back |
| Toasting | 1050ms | Slice drops to `+78`, crust → `--toasted`, coils glow, dial needle spins |
| Pop | 200ms up, then it settles | Slice is thrown to `-30`, drops back to `0`, steam runs, confirmation note appears |
| Reset | 1500ms later | Slice jumps to `+92` (no transition), recolours with no fade, next person's initial, then springs to `0` |

Slice positions: `REST = 0`, `DEEP = 78`, `HOP = -30`, and the slice comes to
rest back at `REST` — the jump does the popping. The slice is a whole piece of
bread: its bottom is hidden behind the chrome cap rather than cut off at it, so
every position has to keep that bottom out of sight.

**Accessibility.** The lever group needs `role="button"`, `tabIndex={0}`, an
`aria-label`, and Enter/Space handling that runs the same cycle. Show a
`--mint` focus ring. Honour `prefers-reduced-motion` by cutting all durations to
near zero and jumping straight to the result.

Extract the drag maths into `useLeverDrag()` in `src/hooks/` so the SVG file
stays declarative. Convert client pixels to SVG units with
`(e.clientY - rect.top) * (350 / rect.height)`.

---

## Data model

```ts
type Person = {
  id: string;          // nanoid
  name: string;
  color: string;       // from a fixed palette, not free-form
  order: number;       // position in the rotation
  active: boolean;     // false = on holiday, skipped automatically
};

type Turn = {
  id: string;
  personId: string;
  madeAt: string;      // ISO date
  rating?: number;     // 1-5, added later by anyone
  skipped: boolean;    // logged without credit
};

type Family = {
  id: string;          // the code that goes in the share link
  name: string;
  people: Person[];
  schedule: { weekday: number; time: string; remind: boolean };  // 0 = Sunday
  turns: Turn[];       // newest first, cap at 200 locally
};
```

**Whose turn it is** is derived, never stored. `getCurrentPerson(family)` in
`src/lib/rotation.ts` walks `people` (active only, sorted by `order`) from the
person after the most recent non-skipped turn. Storing a `currentIndex` will
drift the moment two phones write at once — do not do it.

Also in `rotation.ts`, all pure and all unit-tested:
`getCurrentPerson`, `getUpcoming(n)`, `nextToastDate(schedule, from)`,
`logTurn`, `skipWeek`, `swapPeople(a, b)`, `turnCounts(range)`.

---

## Build phases

Work through these in order. Finish and verify one before starting the next.
Commit at the end of each.

### Phase 1 — Local app that works
- [ ] Scaffold Vite + React + TS, tokens, fonts, base layout
- [ ] `rotation.ts` with tests covering: empty family, one person, everyone
      inactive, skipped turns not advancing the rotation
- [ ] `<Toaster />` ported from the prototype, drag + keyboard both firing the cycle
- [ ] Home screen wired to the store
- [ ] History sheet, swap sheet, schedule editor sheet
- [ ] Setup screen, `localStorage` persistence
- [ ] **Done when:** you can add a family, log four weeks, close the tab, reopen,
      and everything is still there.

### Phase 2 — Real PWA
- [ ] `vite-plugin-pwa`, `registerType: 'autoUpdate'`
- [ ] Manifest: name, `short_name: "ToastTurn"`, `display: "standalone"`,
      `theme_color: "#E9553D"`, `background_color: "#DCE7EE"`, portrait lock
- [ ] Maskable icons at 192/512 — a toast slice on coral, safe area respected
- [ ] iOS meta tags and an apple-touch-icon (iOS ignores most of the manifest)
- [ ] `env(safe-area-inset-*)` on the top bar and the bottom queue
- [ ] An "Add to home screen" hint that appears once and can be dismissed forever
- [ ] **Done when:** it installs on an iPhone and launches with no browser chrome.

### Phase 3 — Sync between phones
- [ ] Firebase project, `families/{id}` documents with a `turns` subcollection,
      security rules keyed on the family id (`firestore.rules`)
- [ ] The family id lives in the URL (`/f/{id}`); opening that link joins
- [ ] "Who am I" picker on first visit, stored per device
- [ ] Realtime subscription so a pop on one phone updates the others
- [ ] Optimistic writes with an offline queue, replayed on reconnect —
      Firestore's persistent cache does this, so do not hand-roll a queue
- [ ] **Done when:** two phones show the same person, and pulling the lever on
      one updates the other within a second.

### Phase 4 — The nice parts
- [ ] Push notification on toast morning (see the caveat below)
- [ ] Rate the toast 1–5, shown in history
- [ ] Fairness stats — turns per person this month
- [ ] Holiday mode toggle per person
- [ ] Orders: each person marks what they want, the maker sees one combined list

**Push caveat:** on iOS, web push only works if the PWA is installed to the home
screen, needs iOS 16.4+, and requires a permission prompt triggered by a user
gesture. Do not build the notification flow until phase 4, and when you do, treat
it as an enhancement that silently no-ops if unsupported. Never block the core
flow on it.

---

## Conventions

- Components are function components with named exports. One component per file.
- No component file over ~150 lines. Push logic into `src/lib/` or a hook.
- `src/lib/` is pure functions only — no React imports, no browser globals.
- All copy lives in `src/i18n/en.ts`. No string literals in JSX.
- CSS lives next to its component as `Component.css`, imported by the component.
  Every colour is a `var(--token)`.
- Never touch `localStorage`, `Date.now()`, or `crypto` outside `src/lib/`. Wrap
  them so tests can fake them.
- Commit messages: `feat:`, `fix:`, `chore:`, one concern each.

## Voice

Plain, warm, short. The interface talks like a person setting the table, not a
system reporting status.

- Buttons say what happens: "Pull down", "Swap", "Start the rotation".
- Confirmations name the person: "Maya did it!" — not "Turn logged successfully".
- Empty states invite: "No one's in the rotation yet. Add the first person."
- Errors say what broke and what to do: "Couldn't sync. Your turn is saved on
  this phone and will go up when you're back online." Never apologise, never
  say "oops", never show an error code.
- Sentence case everywhere except the family member names on the toast.

## Reference

`docs/prototype.html` is the approved design. It is a single self-contained file:
open it in a browser and pull the lever. When something in this document is
ambiguous, the prototype is the answer — match its colours, spacing, timings and
SVG geometry exactly. The prototype uses fake in-memory data; the real app must
not.
