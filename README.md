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
2. Authentication → Get started → Sign-in method → enable **Email/Password**,
   and **Google** if you want one-tap sign-in. Without a sign-in method the app
   has no way to tell whose rotation is whose, so sync stays off and each phone
   keeps its own copy.
3. Copy `.env.example` to `.env.local` and paste in the four values from
   Project settings → General → Your apps → SDK setup and configuration.
4. Publish the rules. They scope everything to the family id and refuse to list
   families, so a code that is never shared is never found, and only the phone
   that created a family can change its people, schedule or rotation:

   ```bash
   npx firebase deploy --only firestore:rules --project <your-project-id>
   ```

5. Restart `npm run dev`. Start a rotation, then **Settings → Copy the link to
   share** and open that link on the second phone.

**Joining.** Starting a rotation asks for your name and nothing else. Everyone
else opens the link, signs in, gives their name and asks to be let in; you see
them waiting in settings and add them to the rotation with one tap. You can also
add people who have no account at all, from **Settings → Add or remove people**.

**Who can change what.** The account that started the rotation runs it: people,
toast night, the order, clearing it. Everyone in the rotation can see whose turn
it is, pull the lever, read the history and rate the toast. That split is
enforced by the rules, not just hidden in the interface.

Writes go through Firestore's persistent cache, so a turn logged with no signal
is stored locally, shown immediately and replayed when the phone is back.

## Deploying

Static build, any host. The family link is a client-side route, so every path
has to fall back to `index.html`, [`vercel.json`](vercel.json) does that on
Vercel and [`public/_redirects`](public/_redirects) does it on Netlify. Set the
same `VITE_FIREBASE_*` variables in the host's environment settings.
