import {
  Connection,
  Keypair,
  VersionedTransaction,
} from "@solana/web3.js";
import { KNOWN_TOKENS } from "./types";

const QUOTE_API = "https://quote-api.jup.ag/v6/quote";
const SWAP_API = "https://quote-api.jup.ag/v6/swap";
const SLIPPAGE_BPS = 50; // 0.5%

export interface SwapQuote {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  priceImpactPct: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rawQuote: any;
}

export interface SwapResult {
  txSignature: string;
  inAmount: bigint;
  outAmount: bigint;
}

function getMint(symbol: string): string {
  const t = KNOWN_TOKENS.find((t) => t.symbol === symbol);
  if (!t) throw new Error(`Unknown token: ${symbol}`);
  return t.mint;
}

export async function getQuote(
  fromSymbol: string,
  toSymbol: string,
  amountBaseUnits: bigint
): Promise<SwapQuote> {
  const inputMint = getMint(fromSymbol);
  const outputMint = getMint(toSymbol);

  const url = `${QUOTE_API}?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amountBaseUnits}&slippageBps=${SLIPPAGE_BPS}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Jupiter quote failed: ${await res.text()}`);
  const quote = await res.json();

  return {
    inputMint,
    outputMint,
    inAmount: quote.inAmount,
    outAmount: quote.outAmount,
    priceImpactPct: quote.priceImpactPct,
    rawQuote: quote,
  };
}

export async function executeSwap(
  connection: Connection,
  agentKeypair: Keypair,
  quote: SwapQuote
): Promise<SwapResult> {
  // Build swap transaction via Jupiter
  const swapRes = await fetch(SWAP_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      quoteResponse: quote.rawQuote,
      userPublicKey: agentKeypair.publicKey.toBase58(),
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
      prioritizationFeeLamports: "auto",
    }),
  });

  if (!swapRes.ok) throw new Error(`Jupiter swap build failed: ${await swapRes.text()}`);
  const { swapTransaction } = await swapRes.json();

  // Deserialize, sign, submit
  const tx = VersionedTransaction.deserialize(
    Buffer.from(swapTransaction, "base64")
  );
  tx.sign([agentKeypair]);

  const sig = await connection.sendRawTransaction(tx.serialize(), {
    skipPreflight: false,
    maxRetries: 3,
  });

  // Confirm
  const latestBlockhash = await connection.getLatestBlockhash();
  await connection.confirmTransaction({
    signature: sig,
    ...latestBlockhash,
  });

  return {
    txSignature: sig,
    inAmount: BigInt(quote.inAmount),
    outAmount: BigInt(quote.outAmount),
  };
}

// Convert USD amount to base units for a given token symbol
export function usdToBaseUnits(amountUsd: number, symbol: string): bigint {
  const token = KNOWN_TOKENS.find((t) => t.symbol === symbol);
  if (!token) throw new Error(`Unknown token: ${symbol}`);
  return BigInt(Math.floor(amountUsd * 10 ** token.decimals));
}
