# Oracle Room front-end

A Next.js front-end for the TxODDS World Cup Hackathon concept:
live rooms + sealed prophecies + VAR Courtroom + Solana proof.

It talks to the local API proxy in `../server.ts` (run from the repo root)
for real TxLINE fixtures/odds data — see the root `README.md` for the full
local setup. Quick version:

```bash
# from the repo root
npm install
npm run dev
```

Open http://localhost:3000. Running this file's `npm run dev` directly also
works, but the "TxLINE connected" status on the matches screen needs the
proxy server (`npm run server` from the repo root) running on port 4000.

## Best demo flow

1. Enter demo match
2. Join "Messi Magic"
3. Start watching
4. Click "I FEEL IT"
5. Choose "Goal"
6. Use the desktop demo control "Trigger goal event"
7. Show the Legendary result
8. Trigger VAR review
9. Vote, then show settlement
10. Jump to full time

## What's already connected

- On load, the app starts a real TxLINE guest session and fetches the real
  World Cup fixture list (shown on the matches screen once the proxy is up).
- While on the live screen, real odds updates stream in over SSE and are
  merged into the match timeline (see `app/lib/api.ts`).

## Still demo-only / where to go next

- `connectWallet()` is still a stub — wire up Solana Wallet Adapter.
- `triggerGoal()` and the score/minute ticker are still scripted for the
  recorded demo flow below; TxLINE's odds stream doesn't carry goal/score
  events in the sample data used here.
- Rooms, votes, reactions and prophecies are still local component state —
  persist them in Supabase/Firebase if you need them to survive a refresh.
- The sealed-prophecy "proof" is still a UI-only message — replace it with a
  real Solana devnet transaction (see `src/subscription_free_tier.ts` at the
  repo root for the on-chain patterns already in place).
