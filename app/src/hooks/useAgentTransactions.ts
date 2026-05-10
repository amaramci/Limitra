"use client";

import { useState, useEffect, useCallback } from "react";

export interface AgentTx {
  id: string;
  sub_wallet_id: string;
  from_symbol: string;
  to_symbol: string;
  amount_usd: number;
  amount_in: number;
  amount_out: number;
  tx_signature: string | null;
  status: "success" | "failed" | "blocked" | "pending";
  blocked_reason: string | null;
  claude_reasoning: string | null;
  created_at: string;
}

export function useAgentTransactions(walletIds: string[], refreshInterval = 10000) {
  const [txs, setTxs] = useState<AgentTx[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch_ = useCallback(async () => {
    if (!walletIds.length) { setTxs([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/transactions?walletIds=${walletIds.join(",")}`);
      if (res.ok) setTxs(await res.json());
    } finally {
      setLoading(false);
    }
  }, [walletIds.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetch_();
    const id = setInterval(fetch_, refreshInterval);
    return () => clearInterval(id);
  }, [fetch_, refreshInterval]);

  return { txs, loading, refresh: fetch_ };
}
