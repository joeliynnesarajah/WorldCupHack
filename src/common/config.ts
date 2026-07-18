// This repo targets the Solana DEVNET program (6pW64gN...), so it must use
// TxLINE's devnet host, not the mainnet one from the API reference example.
// Per https://txline-docs.txodds.com/llms-full.txt:
//   mainnet program 9ExbZjA... -> https://txline.txodds.com/api/
//   devnet  program 6pW64gN... -> https://txline-dev.txodds.com/api/
// Mixing these (e.g. a devnet tx signature against the mainnet API) causes a
// 504 Gateway Timeout — their own docs call this out as a "network mismatch".
export const TXLINE_BASE_URL = process.env.TXLINE_BASE_URL || "https://txline-dev.txodds.com";

export const API_BASE_URL = `${TXLINE_BASE_URL}/api`;

export const JWT_URL = `${TXLINE_BASE_URL}/auth/guest/start`;

export const TOKEN_DECIMALS = 6;

export const durationInSeconds = 300;

export const currentTs = Math.floor(Date.now() / 1000);

export const subscriptionEndTs = currentTs + durationInSeconds;
