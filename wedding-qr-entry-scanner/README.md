# Wedding Entry — QR Ticket Scanner

A mobile-first ticket check-in system for event security. A guard opens the
site on their phone, scans a guest's QR code, and gets a full-screen
GREEN (let them in) or RED/ORANGE (do not let them in) result. That's it.

There is **no guest database**. The system only ever stores anonymous ticket
codes (e.g. `WED-7K92XQ4P`), whether each one has been used, and when.

---

## How it works

- **`/guard`** — the scanner screen. Opens the phone camera, reads a QR code,
  sends it to the backend, and shows the verdict full-screen.
- **`/admin`** — password-protected panel to add codes one at a time, import
  a CSV of codes, remove a code, and see anonymous stats + scan history.
- **`/api/scan`** — the only endpoint the scanner calls. It is the single
  source of truth: the frontend never decides access on its own.

### Why multiple guards can't double-admit the same code

Every valid ticket lives in one Redis **set** of used codes. Marking a code
"used" is a single `SADD` (set-add) call. Redis guarantees that only the
*first* `SADD` for a given code returns "added"; every other simultaneous
call for that same code returns "already there" — even if two guards scan
the exact same QR code on two different phones at the exact same
millisecond. That single atomic operation is what makes it safe, without
needing a database transaction or lock.

```
scan code
  ├─ not in the valid set  →  ACCESS DENIED (nothing is written)
  └─ in the valid set
       ├─ first SADD to "used" succeeds →  ACCESS GRANTED
       └─ SADD fails (already a member)  →  ALREADY USED
```

---

## What's stored (and what's never stored)

Stored, per ticket code only:
- The code itself
- Whether it's been used
- The timestamp it was used
- A rolling log of the last 500 scan events (code + result + time)

**Never stored:** guest name, phone number, email, address, age, gender, or
any other personal detail. The QR code should be generated as a random,
unguessable token (e.g. `WED-7K92XQ4P`) — not a sequential number — so it
can't be spoofed by a guest guessing nearby valid codes.

---

## Tech stack

- **Next.js 15** (App Router) — one project serves both the guard scanner
  and the admin panel, plus the API routes.
- **Upstash Redis** — a serverless Redis reachable over HTTPS, which is what
  makes the atomic check-in work correctly across Vercel's stateless
  functions (a local file or in-memory store would not be shared or safe
  across simultaneous requests).
- **html5-qrcode** — reads the QR code from the phone's rear camera
  (`facingMode: "environment"`) in the browser; no native app required.

---

## Local development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a free Redis database at [console.upstash.com](https://console.upstash.com)
   (Upstash has a free tier that's more than enough for one event).
3. Copy `.env.example` to `.env.local` and fill in:
   ```
   UPSTASH_REDIS_REST_URL=...
   UPSTASH_REDIS_REST_TOKEN=...
   ADMIN_SECRET=pick-a-long-random-string
   ```
4. Run it:
   ```bash
   npm run dev
   ```
5. Visit `http://localhost:3000/admin`, log in with your `ADMIN_SECRET`, and
   add or import a few test codes. Camera access requires HTTPS **or**
   `localhost` — both work for local testing, but any other device on your
   network will need HTTPS (see deployment below).

---

## Deploying to Vercel (HTTPS by default)

1. Push this project to a GitHub repo and import it in
   [vercel.com/new](https://vercel.com/new) — or run `vercel` from this
   folder with the Vercel CLI.
2. In the Vercel project, go to **Storage → Create Database → Upstash for
   Redis** (or connect an existing Upstash database from the integrations
   marketplace). This automatically sets `UPSTASH_REDIS_REST_URL` and
   `UPSTASH_REDIS_REST_TOKEN` for you.
3. Add one more environment variable manually: `ADMIN_SECRET` (any long
   random string — this is the password for `/admin`).
4. Deploy. Vercel serves everything over HTTPS automatically, which is
   required for camera access on iPhone Safari and Android Chrome.
5. Open `https://your-project.vercel.app/admin` on a laptop, add/import your
   guest list's codes before the event.
6. Give each guard the URL `https://your-project.vercel.app/guard` — they
   can bookmark it or add it to their home screen. Any number of guards can
   use it at the same time; the backend keeps them all in sync.

---

## Generating the actual QR codes

This app validates codes — it doesn't design the printed tickets. For each
guest, generate one random code (e.g. `WED-` + 8 random base32 characters),
add it to the valid list via the admin panel or CSV import, and turn that
same string into a QR code image to print or email. Any QR generator library
or website works, as long as the code embedded in the image exactly matches
the code you registered.

### Example CSV to import

```
WED-7K92XQ4P
WED-A82LQ73M
WED-X92P1K8B
```

---

## Notes on the admin panel

- Login is a single shared secret (`ADMIN_SECRET`), not per-user accounts —
  appropriate for a small event team sharing one password, not for a
  multi-organization deployment.
- The secret is sent as a header on every admin API request and cached in
  the browser's `sessionStorage` for that tab only (cleared on logout or
  when the tab closes).
- Stats and history auto-refresh every 8 seconds while the panel is open.

## Known limitation to review before a real event

`npm audit` currently flags a transitive PostCSS vulnerability pulled in by
Next.js's build tooling (not a runtime/production issue, but worth an
`npm audit fix` check closer to your event date in case a newer Next.js
patch has landed).
