# Oracle Room front-end

A self-contained Next.js front-end for the TxODDS World Cup Hackathon concept:
live rooms + sealed prophecies + VAR Courtroom + Solana proof.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

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

## Where to connect real services

- Replace `connectWallet()` with Solana Wallet Adapter.
- Replace `triggerGoal()` and the static timeline with TxLINE SSE/historical replay data.
- Save rooms, votes, reactions and prophecies in Supabase/Firebase.
- Replace the demo proof message with a real Solana devnet transaction.
