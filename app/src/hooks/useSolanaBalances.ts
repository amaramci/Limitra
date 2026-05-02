"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { getSolBalance, getTokenBalances, TokenBalance } from "@/lib/solana";

export function useSolanaBalances() {
  const { publicKey } = useWallet();
  const [sol, setSol] = useState<number | null>(null);
  const [tokens, setTokens] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!publicKey) { setSol(null); setTokens([]); return; }
    const owner = publicKey.toBase58();
    setLoading(true);
    Promise.all([getSolBalance(owner), getTokenBalances(owner)])
      .then(([s, t]) => { setSol(s); setTokens(t); })
      .finally(() => setLoading(false));
  }, [publicKey]);

  return { sol, tokens, loading };
}
