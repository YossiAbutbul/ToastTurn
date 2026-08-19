# Setup

## Running it

```bash
npm install
npm run dev
```

With no Firebase keys the app runs exactly as it did before sync existed: one
phone, `localStorage`, fully offline. Everything except sharing between phones
works this way, which is the fastest way to develop.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server, port 5173 |
| `npm run dev:solo` | A second dev server on port 5175, for testing two "phones" side by side |
| `npm run build` | Type check, build, generate the service worker |
| `npm run preview` | Serve the production build — needed to exercise the PWA |
| `npm test` | Vitest over the rotation, calendar, orders, merge and reducer logic |
| `npm run test:watch` | The same, watching |
| `npm run lint` | ESLint |
| `npm run icons` | Regenerate the app icons from `assets/slice.svg` |
| `npm run og` | Regenerate the social card: `assets/og.svg` plus the app's own `<ToastSlice/>` |
| `npm run screens` | Redraw the README screenshots from the running app |
| `npm run emulator` | Firestore emulator, needs JDK 21+ |

### The link preview card

`npm run og` builds `public/og.png`. The card's background and type live in
`assets/og.svg`, but the slice on it does not: the script renders the app's own
[`ToastSlice`](../src/components/ToastSlice.tsx) with `react-dom/server`, paints
it by reading `ToastSlice.css` and resolving the tokens it names, and drops the
result into the `<!--slice-->` marker.

That is deliberate. A copy of the slice used to sit in `assets/og.svg`, and it
went stale the next time the crumb moved — the card and the front door drew
different bread for weeks before anyone noticed. Now the geometry and the
colours have one home.

Only single-class rules are read from the stylesheet. The compound ones are the
toasted state, which the card does not show; anything else compound is reported
on stdout rather than silently skipped. `assets/og.built.svg` is written beside
the card each run, so the exact thing that was rasterised can be opened when the
picture looks wrong. It is not committed.

### Regenerating the screenshots

`npm run screens` drives a headless Chrome against a dev server that is already
running, seeds one phone with a demo family, and writes every picture in
[`screens/`](screens/). It finds Chrome in the usual places; set `CHROME` to the
binary if yours is somewhere else, and `APP_URL` if the server is not on 5173.

```bash
npm run dev          # in one terminal
npm run screens      # in another
```

## Sync between phones

Optional. Add the keys and the same family shows up on every phone that has the
link.

1. Create a Firebase project and a **Web app** inside it — no hosting needed.
   Enable **Cloud Firestore** in production mode.
2. **Authentication → Sign-in method**: enable **Anonymous** and **Google**.
   Anonymous is what every phone is handed quietly; Google is what the person
   who runs the rotation signs in with. Without a sign-in method the app has no
   way to tell whose rotation is whose, so sync stays off and each phone keeps
   its own copy.
3. Copy `.env.example` to `.env.local` and paste in the values from
   **Project settings → General → Your apps → SDK setup and configuration**.

   ```
   VITE_FIREBASE_API_KEY=
   VITE_FIREBASE_AUTH_DOMAIN=
   VITE_FIREBASE_PROJECT_ID=
   VITE_FIREBASE_APP_ID=
   ```

   Two optional ones are documented in `.env.example`:
   `VITE_FIREBASE_EMULATOR` points at a local emulator instead of the real
   project, and `VITE_FIREBASE_APPCHECK_KEY` makes the project answer only calls
   that came from this app in a real browser.

4. Publish the rules:

   ```bash
   npx firebase deploy --only firestore:rules --project <your-project-id>
   ```

5. Restart `npm run dev`. Start a rotation, then **Settings → Copy the link to
   share** and open that link on the second phone.

### What the rules protect

Nothing can list families, so a code that is never shared is never found, and
reading anything at all needs an account. The account that started a rotation
runs it: the people, the rotation, clearing it. Everyone in the rotation can see
whose turn it is, pull the lever, read the history and rate the toast. Each
person's own order and colour are theirs.

That split is enforced in [`firestore.rules`](../firestore.rules), not merely
hidden in the interface. See [architecture.md](architecture.md#what-the-rules-enforce)
for why it is shaped this way.

### Joining

Starting a rotation asks for a Google sign-in and your name, and nothing else.
Everyone else opens the link and taps their own name — no sign-up, no approval,
nothing typed. Anyone the owner never wrote down can put themselves in. The
owner can also add people who have no phone at all, from the **+** at the end of
the queue — "Add or arrange who makes toast", which is also where reordering and
holiday mode live.

Anyone with the code can claim any name. That is the accepted trade: the code is
the secret.

## Deploying

A static build, on any host.

The family link is a client-side route, so every path has to fall back to
`index.html`. [`vercel.json`](../vercel.json) does that on Vercel and
[`public/_redirects`](../public/_redirects) does it on Netlify.

Set the same `VITE_FIREBASE_*` variables in the host's environment settings, or
the deployed app will run local-only.

```bash
npm run build
npm run preview   # check the PWA before pushing
```
