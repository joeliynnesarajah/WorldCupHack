# WorldCupHack — Oracle Room

Two pieces:

- **`src/`** (this root package) — Solana devnet program client + a small
  Express proxy (`src/server.ts`) that holds a TxODDS TxLINE guest session
  and forwards fixture/odds requests for the frontend. See
  [TxLINE API reference](https://txline.txodds.com/api-reference/authentication/start-a-new-guest-session).
- **`src/oracle-room-frontend/`** — the Next.js UI, which talks to the proxy
  above instead of calling TxLINE directly (TxLINE doesn't send browser CORS
  headers, and the guest JWT shouldn't live in client-side JS).

```
 Browser (Next.js, :3000)
      │  fetch("/api/...")
      ▼
 Local proxy (Express, :4000) ── holds the TxLINE guest JWT
      │  Bearer <jwt>
      ▼
 https://txline.txodds.com  (fixtures / odds / guest session)
```

## Run it locally

```bash
npm install            # installs root deps + frontend deps (postinstall)
cp .env.example .env    # optional — defaults already point at the real TxLINE host
cp src/oracle-room-frontend/.env.local.example src/oracle-room-frontend/.env.local

npm run dev             # starts the API proxy (:4000) and the frontend (:3000) together
```

Then open http://localhost:3000.

Run them separately if you prefer two terminals:

```bash
npm run server     # API proxy on http://localhost:4000
npm run frontend   # Next.js dev server on http://localhost:3000
```

## Test the API proxy directly

With `npm run server` running:

```bash
curl -X POST http://localhost:4000/api/session          # starts a TxLINE guest session, returns a JWT
curl http://localhost:4000/api/fixtures?competitionId=72 # real World Cup fixture snapshot
curl http://localhost:4000/api/odds/17588320             # odds snapshot for a fixture
curl -N http://localhost:4000/api/odds/stream            # live odds SSE feed (Ctrl+C to stop)
```

If `/api/session` fails, check that `https://txline.txodds.com` is reachable
from your network and that `TXLINE_BASE_URL` in `.env` (if set) is correct.

`/api/fixtures` and `/api/odds/:fixtureId` will return `"Missing API token"`
until you've completed the on-chain flow below — TxLINE uses a two-tier
system where the guest JWT (from `/api/session`) only proves you have a
session; reading actual fixture/odds data additionally requires the API
token minted by `/token/activate` after an on-chain subscription purchase.
The frontend already handles this gracefully (matches screen shows
"TxLINE offline · showing demo data" and falls back to the scripted demo).

## On-chain subscription flow (needed for real fixtures/odds data; needs a funded devnet wallet)

`src/main.ts` and `src/subscription_free_tier.ts` run the full Solana
devnet subscribe → activate → fetch-data flow using a local wallet keypair
(`~/.config/solana/id.json` by default):

```bash
npx tsx src/main.ts
```

This prints the resulting API token. To make the frontend use it instead of
just the guest session, set it as `userState.apiToken` for the
`"oracle-room-frontend"` session in `src/server.ts` (or extend `/api/session`
to accept a token), then restart `npm run server`.
