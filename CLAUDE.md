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
   the device was the whole system. Phase 3 replaced that with sign-ins and an
   owner's approval queue, and on 17 Aug 2026 the owner had most of it taken
   back out again: approving your own family to use a toast app is the
   overkill, not the account underneath it. What stands now:

   - **The owner signs in with Google, and nobody else signs in at all.**
     Running a rotation has to outlive a wiped phone, so it needs an account
     that can be got back. Starting a rotation is the only thing that asks for
     one. There is no email-and-password anywhere.
   - **Every other phone is given an anonymous account, quietly.** No screen,
     no prompt, nothing typed. It exists so the server has somebody to check.
   - **Joining is claiming.** Open the link, tap your own name, done. Nobody
     asks and nobody approves. Anyone the owner never wrote down puts
     themselves in, which is why the people are documents of their own rather
     than a list on the family: a list can only be written whole, and that
     would make it the owner's alone.
   - **Anyone with the code can claim any name.** That is the accepted trade.
     The code is the secret; the data is who made toast and who wants cheese.
   - **What a claim buys you** is that your order and your colour are yours,
     which the rules hold. Logging the toast is open to everyone in the
     rotation, because whoever pulls the lever is rarely who gets credited.
   - **A wiped phone loses its claim, not its history.** Turns and orders are
     keyed by person, so re-tapping your name gets everything back.
   - **Each phone deletes its own account, and only its own.** Clearing a
     rotation cannot reach out and tidy up after the phones that were in it:
     the client SDK deletes `currentUser` and nothing else, and deleting
     somebody else needs an admin key, which is a server, which would mean
     Blaze. So a phone lets go of its anonymous account the next time it opens
     and finds the rotation gone. That bounds the leftovers to one per phone
     still in use rather than one per rotation ever started. A phone that
     never opens the app again keeps its account, and those are cleared from
     the console by hand. Weighed against a Cloud Function on 17 Aug 2026 and
     the function was turned down: the whole app is meant to cost nothing and
     have no server.

3. **Works offline.** Opening the app on the kitchen wifi dead-spot must still
   show whose turn it is. Writes queue and sync when back online.
4. **The main screen answers the question with zero taps.** Everything else —
   history, orders, settings — is behind a control.
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
| Framework | React 19 + TypeScript | Mature PWA tooling; the app is tiny so anything works, but pick one and stay |
| Build | Vite | Fast, and `vite-plugin-pwa` handles the manifest and service worker |
| Styling | Plain CSS with custom properties, one file per component | The design is bespoke SVG and hand-tuned tokens. A utility framework would fight it |
| State | React context + `useReducer` in `src/store/` | Five people and a queue. Redux/Zustand is overkill |
| Persistence (phase 1) | `localStorage`, wrapped in `src/lib/storage.ts` | Never call `localStorage` directly from a component |
| Persistence (phase 3) | Firebase Firestore + Auth (web SDK) | Free tier, realtime listeners, and its persistent cache queues offline writes for us. Auth arrived with phase 3: see non-negotiable 2 for how little of it is asked for |
| Hosting | Netlify or Vercel, static | Push to main, deploy |
| Tests | Vitest over `src/lib/` and the reducer | The rotation, the calendar, the colours, the orders and the merge. Do not chase coverage on UI |

Do **not** add: a router library (five screens, held in `useState`), a UI
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

Alongside the colours, `tokens.css` carries `--display` and `--ui` for the two
font stacks, and two incidental shades lifted from the prototype: `--dash` for
dashed row rules and toggle tracks, `--steam` for the steam. Nothing else has
been added and nothing else should be, without asking.

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

Five, plus bottom sheets, and no router — `App.tsx` holds which one in
`useState`.

| Screen | When |
|---|---|
| `Welcome` | Nothing open on this phone, or a way back to the front door |
| `Setup` | Starting a rotation |
| `Joining` | A share link naming a rotation this phone has not got yet |
| `Claim` | That link has landed and the rotation is asking which name is you |
| `Home` | The answer, and everything else behind a control |

### Home (`src/screens/Home.tsx`)

```
┌──────────────────────────────┐
│ ToastTurn  [History] (⚙) (Y) │  ← settings, and you
├──────────────────────────────┤
│      THIS WEEK IT'S          │
│          YOSSI               │  ← Baloo 2 800, ~56px, --coral
│   4 turns so far · Aug 9     │
│                              │
│        ┌──────────┐          │
│        │  slice   │          │  ← <Toaster />, the whole illustration
│        │ ╔══════╗ │  ▓ lever │
│        │ ║ body ║ │          │
│        └──────────┘          │
│                              │
│  Pull the lever when done    │
│        [ Order now ]         │
│                              │
│   [A] [N] [T] [B]            │  ← queue, next-up in coral
└──────────────────────────────┘   tap anyone to see what they want
```

The sheets it opens live in `HomeSheets.tsx`: history, one day of it, orders,
the rotation, you, and settings.

### Setup (`src/screens/Setup.tsx`)

Starting a rotation asks two things: what it is called, and who you are in it.
That is all, because it is all that cannot be asked anywhere else — the people
live in a sheet off the queue and the name behind a pen beside it. "Start the
rotation" writes the family and lands on Home.

Adding, removing, reordering and holiday mode all live in the rotation sheet
(`RotationSheet` → `RosterList`), reached from the `+` at the end of the queue.
Reordering there is a pair of buttons per person, not a drag: a 44px target that
works with a thumb, a keyboard and a screen reader beats a gesture that works
with one of the three.

---

## The toaster component

One inline SVG, `viewBox="0 -50 340 350"`, ported from `docs/prototype.html`
rather than redrawn. It is composed from three files, which is what keeps any
one of them readable: `Toaster.tsx` holds the `<svg>`, the lever and the cycle,
`ToastSlice.tsx` the bread, `ToasterBody.tsx` everything chrome and coral. They
are still one element on the page.

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
  madeAt: string;      // ISO timestamp, not just the day: two turns on one
                       // date still order the same way on every phone
  ratings?: Record<string, number>;  // 1-5, keyed by account. Everyone votes,
                                     // the row shows the average
  rating?: number;     // one rating from before they were per person
  skipped: boolean;    // logged without credit
};

type Family = {
  id: string;             // the code that goes in the share link
  ownerUid?: string;      // the account that runs it
  ownerPersonId?: string; // which person in the rotation that is
  name: string;
  people: Person[];
  turns: Turn[];          // newest first, cap at 200 locally
  removed?: string[];     // turns taken off the board, by id
};
```

There is no schedule. A weekly toast night was built and then taken out on
17 Aug 2026: the calendar is the record, and a rotation with nothing scheduled
still answers the only question the app asks. Do not put one back without
being asked for it.

`removed` is there because two phones' logs merge by union: deleting a turn on
one phone brings it straight back from the other, and then republishes it. The
id is remembered instead and every phone drops it.

**Whose turn it is** is derived, never stored. `getCurrentPerson(family)` in
`src/lib/rotation.ts` walks `people` (active only, sorted by `order`) from the
person after the most recent non-skipped turn. Storing a `currentIndex` will
drift the moment two phones write at once — do not do it.

Also in `rotation.ts`, all pure and all unit-tested: `activePeople`,
`getPerson`, `getUpcoming`, `rotationOrder`, `logTurn`, `removeTurn`,
`skipWeek`, `turnCounts`, `monthRange`, `lastTurnFor`.

---

## Build phases

Work through these in order. Finish and verify one before starting the next.
Commit at the end of each.

All four are through, as of 19 Aug 2026. What is left is kept below as the
record of what was built, what was dropped and why — read it before proposing
anything it already turned down.

### Phase 1 — Local app that works · **done**
- [x] Scaffold Vite + React + TS, tokens, fonts, base layout
- [x] `rotation.ts` with tests covering: empty family, one person, everyone
      inactive, skipped turns not advancing the rotation
- [x] `<Toaster />` ported from the prototype, drag + keyboard both firing the cycle
- [x] Home screen wired to the store
- [x] History sheet — a month calendar and a list of every turn
- [x] Setup screen, `localStorage` persistence
- [x] **Done when:** you can add a family, log four weeks, close the tab, reopen,
      and everything is still there.

### Phase 2 — Real PWA · **done**
- [x] `vite-plugin-pwa` — `registerType: 'prompt'`, not `autoUpdate`: a deploy
      is not swapped in under someone mid-pull, the app says a new one is ready
      and waits to be told
- [x] Manifest: name, `short_name: "ToastTurn"`, `display: "standalone"`,
      `theme_color: "#E9553D"`, `background_color: "#DCE7EE"`, portrait lock
- [x] Maskable icons at 192/512 — a toast slice on coral, safe area respected
- [x] iOS meta tags and an apple-touch-icon (iOS ignores most of the manifest)
- [x] `env(safe-area-inset-*)` on the top bar and the bottom queue
- [x] An "Add to home screen" hint that appears once and can be dismissed forever
- [x] **Done when:** it installs on an iPhone and launches with no browser chrome.

### Phase 3 — Sync between phones · **done**
- [x] Firebase project, `families/{id}` documents with `people` and `turns`
      subcollections and `prefs/{members,orders}`, security rules keyed on the
      family id (`firestore.rules`). The people are documents of their own
      because they are the one part of a rotation somebody other than the owner
      may add to — a list can only be written whole
- [x] The family id lives in the URL (`/f/{id}`); opening that link joins
- [x] "Who am I" picker on first visit, stored per device
- [x] Realtime subscription so a pop on one phone updates the others
- [x] Optimistic writes with an offline queue, replayed on reconnect —
      Firestore's persistent cache does this, so do not hand-roll a queue
- [x] **Done when:** two phones show the same person, and pulling the lever on
      one updates the other within a second.

### Phase 4 — The nice parts · **done**
- [x] ~~Push notification on toast morning~~ — dropped by the owner on
      17 Aug 2026, after building it and walking through the setup. The caveat
      below turned out to understate it: a reminder needs a Firebase service
      account, a scheduler, and on the free plan a single daily cron that
      cannot fire at the family's own hour. The work lives on the `feat/push`
      branch, unmerged, if it is ever wanted.
- [x] ~~Hand the rotation over to someone else's account~~ — built, then
      dropped by the owner on 17 Aug 2026 along with the approval queue. With
      everyone but the owner on an anonymous account there is nobody it could
      safely go to: an account that evaporates with the browser cache cannot
      be handed a family. Worth revisiting if members are ever offered a
      "remember me on this phone" that links a Google account to theirs.
- [x] Rate the toast 1–5, shown in history. Everyone with an account gets a
      vote and the row shows the average
- [x] Fairness stats — turns per person this month, above the list of turns
- [x] Holiday mode toggle per person
- [x] Orders: each person marks what they want, the maker sees one combined
      list. Up to three slices each, every slice its own bread and toppings,
      plus a short note. A tap on the queue opens one person's
- [x] ~~Swapping turns: ask someone to take yours, they accept or decline~~ —
      dropped by the owner on 17 Aug 2026 as redundant. A tap on the queue
      along the bottom now opens what that person wants instead. Reordering
      the rotation by hand is still there, under "Add or arrange who makes
      toast".

**Push caveat, kept for the record.** On iOS, web push only works if the PWA is
installed to the home screen, needs iOS 16.4+, and requires a permission prompt
triggered by a user gesture. Building it confirmed all of that and added more:
the browser half is the easy half. If it is ever picked up again, start from
`feat/push`, where the client works end to end and only the scheduled sender is
unproven.

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
- Commit messages: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, one
  concern each. The subject says what changed for whoever uses the app, not
  which files moved.

## Voice

Plain, warm, short. The interface talks like a person setting the table, not a
system reporting status.

- Buttons say what happens: "Pull down", "Order now", "Start the rotation".
- Confirmations name the person: "Yossi did it!" — not "Turn logged successfully".
- Empty states invite: "No one's in the rotation yet. Add the first person."
- Errors say what broke and what to do: "Couldn't sync. Your turn is saved on
  this phone and will go up when you're back online." Never apologise, never
  say "oops", never show an error code.
- Sentence case everywhere except the family member names on the toast.

## Reference

`docs/` holds the written-down half: `architecture.md` (the layout, the data
model, the shape on the server, what the rules hold), `setup.md` (running it,
the scripts, the keys, deploying) and `design.md` (the tokens, the toaster's
timings, the voice). They describe what the code does; this file says what it
must keep doing, and why the things that are gone are gone. When the two
disagree, the code is what `docs/` got wrong.

`docs/prototype.html` is the approved design. It is a single self-contained file:
open it in a browser and pull the lever. When something in this document is
ambiguous, the prototype is the answer — match its colours, spacing, timings and
SVG geometry exactly. The prototype uses fake in-memory data; the real app must
not.
