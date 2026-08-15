# ToastTurn

A tiny PWA that answers one question: **whose turn is it to make toast this week?**

Open it, read the name, pull the lever when the toast is made. No accounts, no
logins, works with the wifi off. See [CLAUDE.md](CLAUDE.md) for the design rules
and [docs/prototype.html](docs/prototype.html) for the approved look.

## Running it

```bash
npm install
npm run dev
```

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Type check, build, generate the service worker |
| `npm run preview` | Serve the production build (needed to exercise the PWA) |
| `npm test` | Vitest over the rotation and merge logic |
| `npm run icons` | Regenerate the app icons from `assets/slice.svg` |
| `npm run emulator` | Firestore emulator (needs JDK 21+) |

## Sync between phones

Sync is optional. With no Firebase keys the app runs exactly as it always has:
one phone, local storage, fully offline. Add the keys and the same family shows
up on every phone that has the link.

1. Create a Firebase project and a **Web app** in it (no hosting needed). Enable
   **Cloud Firestore** in production mode.
2. Authentication → Get started → Sign-in method → enable **Anonymous**. Nobody
   ever signs in or sees this; it exists so the server can tell the phone that
   started the family from the phones that joined it. Without it, sync is off
   and the app stays local to each phone.
3. Copy `.env.example` to `.env.local` and paste in the four values from
   Project settings → General → Your apps → SDK setup and configuration.
4. Publish the rules. They scope everything to the family id and refuse to list
   families, so a code that is never shared is never found — and only the phone
   that created a family can change its people, schedule or rotation:

   ```bash
   npx firebase deploy --only firestore:rules --project <your-project-id>
   ```

5. Restart `npm run dev`. Open the app, then **Settings → Copy the link for the
   family** and open that link on the second phone. It joins, asks which person
   is holding it, and from then on a pull on one phone lands on the other.

**Who is who.** Making toast needs no account: open the link, see the turn, pull
the lever. Signing in — Google, or an email and password — is what makes a toast
*yours*. The rotation stores each person's email, so a signed-in phone works out
which person is holding it and their colour follows them to any device. Put
those addresses in when you add people.

**Who can change what.** The account that created the rotation runs it: people,
schedule, order, clearing it. Everyone else can see whose turn it is, pull the
lever, read the history and set their own colour. That split is enforced by the
rules, not just hidden in the interface.

Writes go through Firestore's persistent cache, so a turn logged with no signal
is stored locally, shown immediately and replayed when the phone is back.

## Deploying

Static build, any host. The family link is a client-side route, so every path
has to fall back to `index.html` — [`vercel.json`](vercel.json) does that on
Vercel and [`public/_redirects`](public/_redirects) does it on Netlify. Set the
same `VITE_FIREBASE_*` variables in the host's environment settings.
