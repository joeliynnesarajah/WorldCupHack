import * as anchor from "@coral-xyz/anchor";
import os from "os";
import path from "path";
import txoracleIdl from "./idl/txoracle.json";
import type { Txoracle } from "./types/txoracle";
import * as config from "./common/config";
import { setupUser, userAuthMap, apiClient } from "./common/users";

// ---------------------------------------------------------
// Devnet connection + program setup
// ---------------------------------------------------------
const DEVNET_PROGRAM_ID = new anchor.web3.PublicKey(
  "6pW64gN1s2uqjHkn1unFeEjAwJkPGHoppGvS715wyP2J"
);
const DEVNET_TOKEN_MINT = new anchor.web3.PublicKey(
  "4Zao8ocPhmMgq7PdsYWyxvqySMGx7xb9cMftPMkEokRG"
);

const connection = new anchor.web3.Connection(
  "https://api.devnet.solana.com",
  "confirmed"
);

// A throwaway/dummy wallet just to satisfy AnchorProvider's constructor —
// setupUser() loads the REAL signing keypair itself from keypairLocation below.
const dummyWallet = new anchor.Wallet(anchor.web3.Keypair.generate());
const provider = new anchor.AnchorProvider(connection, dummyWallet, {
  commitment: "confirmed",
});
anchor.setProvider(provider);

const program = new anchor.Program<Txoracle>(
  txoracleIdl as Txoracle,
  provider
);

if (!program.programId.equals(DEVNET_PROGRAM_ID)) {
  throw new Error(
    `Loaded IDL program ${program.programId.toBase58()} does not match devnet program ${DEVNET_PROGRAM_ID.toBase58()}`
  );
}

// ---------------------------------------------------------
// Run the free-tier subscription + activation flow
// ---------------------------------------------------------
async function main() {
  const keypairLocation = path.join(os.homedir(), ".config", "solana", "id.json");

  const SERVICE_LEVEL_ID = 1; // devnet free tier
  const DURATION_WEEKS = 4;
  const SELECTED_LEAGUES: number[] = []; // standard free bundle

  const user = await setupUser(
    "hackathon-user",
    keypairLocation,
    DEVNET_TOKEN_MINT,
    connection,
    program,
    SERVICE_LEVEL_ID,
    DURATION_WEEKS,
    SELECTED_LEAGUES
  );

  console.log("Setup complete:", user);

  const state = userAuthMap.get("hackathon-user");
  console.log("API Token:", state?.apiToken);
  console.log("JWT:", state?.jwt);

  const fixtures = await apiClient.get("/fixtures/snapshot", {
  // @ts-expect-error - userName is a custom field read by the interceptor
    userName: "hackathon-user",
  });
  console.log(`Retrieved ${fixtures.data.length} fixtures`);
  console.log(fixtures.data.slice(0, 3));

}

main().catch((err) => {
  console.error("Fatal error in main():", err);
  process.exit(1);
});