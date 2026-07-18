import { Keypair } from "@solana/web3.js";
import fs from "fs";
import os from "os";
import path from "path";
import * as anchor from "@coral-xyz/anchor";

const keypairPath = path.join(os.homedir(), ".config", "solana", "id.json");
const secretKey = JSON.parse(fs.readFileSync(keypairPath, "utf-8"));
const payerKeypair = Keypair.fromSecretKey(new Uint8Array(secretKey));

export default payerKeypair;