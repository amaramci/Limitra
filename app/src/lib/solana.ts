import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { KNOWN_TOKENS } from "./types";

const RPC = process.env.NEXT_PUBLIC_SOLANA_RPC ?? "https://api.devnet.solana.com";

export function getConnection() {
  return new Connection(RPC, "confirmed");
}

export interface TokenBalance {
  mint: string;
  symbol: string;
  amount: number;   // raw, adjusted for decimals
  decimals: number;
}

export async function getSolBalance(owner: string): Promise<number> {
  try {
    const conn = getConnection();
    const lamports = await conn.getBalance(new PublicKey(owner));
    return lamports / LAMPORTS_PER_SOL;
  } catch {
    return 0;
  }
}

export async function getTokenBalances(owner: string): Promise<TokenBalance[]> {
  try {
    const conn = getConnection();
    const { value } = await conn.getParsedTokenAccountsByOwner(
      new PublicKey(owner),
      { programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA") }
    );

    const balances: TokenBalance[] = [];
    for (const account of value) {
      const info = account.account.data.parsed?.info;
      if (!info) continue;
      const mint: string = info.mint;
      const amount: number = info.tokenAmount?.uiAmount ?? 0;
      const decimals: number = info.tokenAmount?.decimals ?? 0;
      if (amount === 0) continue;
      const symbol = KNOWN_TOKENS.find((t) => t.mint === mint)?.symbol ?? mint.slice(0, 6);
      balances.push({ mint, symbol, amount, decimals });
    }
    return balances;
  } catch {
    return [];
  }
}
