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

1. Create a Firebase project and a **Web app** in it (no auth, no hosting
   needed). Enable **Cloud Firestore** in production mode.
2. Copy `.env.example` to `.env.local` and paste in the four values from
   Project settings → General → Your apps → SDK setup and configuration.
3. Publish the rules — they scope everything to the family id and refuse to list
   families, so a code that is never shared is never found:

   ```bash
   npx firebase deploy --only firestore:rules --project <your-project-id>
   ```

4. Restart `npm run dev`. Open the app, then **Settings → Copy the link for the
   family** and open that link on the second phone. It joins, asks which person
   is holding it, and from then on a pull on one phone lands on the other.

Writes go through Firestore's persistent cache, so a turn logged with no signal
is stored locally, shown immediately and replayed when the phone is back.

## Deploying

Static build, any host. The family link is a client-side route, so every path
has to fall back to `index.html` — [`vercel.json`](vercel.json) does that on
Vercel and [`public/_redirects`](public/_redirects) does it on Netlify. Set the
same `VITE_FIREBASE_*` variables in the host's environment settings.
