# Architecture

How ToastTurn is put together. For the constraints that produced these choices,
and the decisions that were made and later taken back out, see
[../CLAUDE.md](../CLAUDE.md).

## Stack

| Concern | Choice |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite, with `vite-plugin-pwa` for the manifest and service worker |
| Styling | Plain CSS with custom properties, one file per component |
| State | React context + `useReducer` in `src/store/` |
| Persistence, local | `localStorage`, wrapped in `src/lib/storage.ts` |
| Persistence, shared | Firebase Firestore, web SDK, optional |
| Tests | Vitest, over the pure logic in `src/lib/` and the reducer |

Deliberately absent: a router (there are three screens, held in `useState`), a
UI component library, a date library, an animation library, an ORM.

## Layout

```
src/
  lib/        Pure functions. No React, no browser globals, no Date.now().
  hooks/      Everything stateful that is not a component.
  store/      The family reducer, its context and its provider.
  screens/    Welcome, Setup, Joining, Home.
  components/ One component per file, none much over 150 lines.
  i18n/en.ts  Every user-facing string. No copy is stranded in JSX.
  styles/     tokens.css, base.css, ui.css.
```

Two rules hold this in shape:

- `src/lib/` is pure. `localStorage`, `Date.now()` and `crypto` are wrapped
  (`storage.ts`, `clock.ts`, `id.ts`) so tests can fake them and no component
  reaches for a global.
- No string literal appears in JSX. `src/i18n/en.ts` is the only place copy
  lives, and CSS uses logical properties (`margin-inline-start`) throughout.
  Both habits came from a Hebrew translation that was dropped; they were kept
  because they are worth keeping.

## Data model

```ts
type Person = {
  id: string;
  name: string;
  color: string;   // from a fixed palette, not free-form
  order: number;   // position in the rotation
  active: boolean; // false = on holiday, skipped automatically
};

type Turn = {
  id: string;
  personId: string;
  madeAt: string;                   // ISO timestamp, not just a date
  ratings?: Record<string, number>; // 1-5, keyed by account
  skipped: boolean;                 // logged without credit
};

type Family = {
  id: string;            // the code that goes in the share link
  ownerUid?: string;     // the account that runs it
  ownerPersonId?: string;
  name: string;
  people: Person[];
  turns: Turn[];         // newest first, capped at 200 locally
  removed?: string[];    // turns taken off the board, by id
};
```

`madeAt` carries the time and not only the day, so two turns logged on the same
date still order the same way on every phone.

`removed` exists because two phones' logs are merged by union: deleting a turn
on one phone would bring it straight back from the other, and then republish it.
The id is remembered instead and every phone drops it.

## Whose turn it is

Derived, never stored. `getCurrentPerson(family)` in
[`src/lib/rotation.ts`](../src/lib/rotation.ts) walks the active people, sorted
by `order`, from the person after the most recent non-skipped turn.

A stored `currentIndex` would drift the moment two phones wrote at once. That is
the reason, and it is not negotiable.

`rotation.ts` is pure and unit-tested throughout: `activePeople`,
`getCurrentPerson`, `getUpcoming`, `rotationOrder`, `logTurn`, `removeTurn`,
`skipWeek`, `turnCounts`, `monthRange`, `lastTurnFor`.

There is no stored toast night. A weekly schedule was tried and taken out: the
calendar is the record, and a rotation with nothing scheduled still answers the
only question the app asks.

## Sync and identity

Sync is optional. With no Firebase keys the app is exactly what it was before
sync existed: one phone, `localStorage`, fully offline.

With keys, the shape on the server is:

```
families/{id}                 name, ownerUid, ownerPersonId, removed
  people/{personId}           one document each
  turns/{turnId}              one document each
  prefs/members               who each account claims to be
  prefs/orders                what everyone wants
```

`people` is a collection rather than a field on the family because it is the one
part of a rotation somebody other than the owner may add to — a list can only be
written whole, which would make it the owner's alone.

The identity model, as it stands:

- **The owner signs in with Google, and nobody else signs in at all.** Running a
  rotation must outlive a wiped phone, so it needs an account that can be got
  back. Starting a rotation is the only thing that asks for one. There is no
  email-and-password anywhere.
- **Every other phone is handed an anonymous account, quietly.** No screen, no
  prompt, nothing typed. It exists so the server has somebody to check.
- **Joining is claiming.** Open the link, tap your name, done. Nobody approves.
- **Anyone with the code can claim any name.** That is the accepted trade. The
  code is the secret; the data is who made toast and who wants cheese.
- **A wiped phone loses its claim, not its history.** Turns and orders are keyed
  by person, so re-tapping the name gets everything back.

Signing in with Google *links* onto the anonymous account the phone already has,
keeping the same uid — so the turns, the orders and the claimed person all
survive the sign-in.

### What the rules enforce

[`firestore.rules`](../firestore.rules) rests on three ideas:

1. The family code says which rotation; being signed in says whether you are in
   it. Nobody can go looking for families that are not theirs, so a code that is
   never shared is never found. The one query allowed is `ownerUid == you`: the
   rule is checked against every document a query could return, so a sweep is
   refused outright rather than filtered.
2. One account runs the family. Only the signed-in owner changes the people or
   the rotation, or clears it.
3. Everyone else may only ever act as themselves. The rules look up the phone's
   claim and hold every write to it: your order and your colour are yours.

Logging toast is open to everyone in the rotation, because whoever pulls the
lever is rarely who gets credited.

An owner signing in on a phone that holds no rotation asks that one query
(`ownedFamilies` in [`src/lib/remote.ts`](../src/lib/remote.ts)) and puts the
answer in the address bar, which is the road every share link already takes.
Without it the account was a way of being recognised and not a way back in: the
link is the half of this that does not survive a wiped phone.

Each phone deletes only its own account. Clearing a rotation cannot tidy up
after the phones that were in it — the client SDK deletes `currentUser` and
nothing else, and deleting somebody else needs an admin key, which needs a
server. So a phone lets go of its anonymous account the next time it opens and
finds the rotation gone.

## Offline

Firestore's persistent cache is the offline queue. Writes go into it, are shown
immediately, and replay when the phone is back. Nothing is hand-rolled on top of
it, and nothing should be.

The service worker (`registerType: 'prompt'`) precaches the fonts and the
toaster. A deploy is never swapped in under someone mid-pull: the app says a new
version is ready and waits to be told.

## Merging

[`src/lib/mergeFamily.ts`](../src/lib/mergeFamily.ts) reconciles what a phone
holds with what the server sends. Turns merge by union of ids minus `removed`;
people merge per document, so two phones adding two different people both land.

## Tests

```bash
npm test
```

Vitest, `src/**/*.test.ts`, in a node environment. Coverage is deliberately
narrow: the rotation, the calendar, the colour rules, the orders, the merge and
the reducer. The UI is not tested and is not meant to be.
