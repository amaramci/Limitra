"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet, useAnchorWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { SubWallet, PolicyConfig } from "@/lib/types";
import {
  getProgram,
  fetchAllSubWallets,
  createSubWallet as createOnChain,
  updatePolicy as updatePolicyOnChain,
  pauseSubWallet as pauseOnChain,
} from "@/lib/program";
import { loadTransactions } from "@/lib/storage";

export function useSubWallets() {
  const { publicKey } = useWallet();
  const anchorWallet = useAnchorWallet();
  const [wallets, setWallets] = useState<SubWallet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!publicKey || !anchorWallet) { setWallets([]); return; }
    setLoading(true);
    setError(null);
    try {
      const program = getProgram(anchorWallet);
      const onChain = await fetchAllSubWallets(program, publicKey);
      setWallets(onChain);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch wallets");
    } finally {
      setLoading(false);
    }
  }, [publicKey, anchorWallet]);

  useEffect(() => { refresh(); }, [refresh]);

  async function create(
    name: string,
    description: string,
    policy: PolicyConfig
  ): Promise<SubWallet | null> {
    if (!publicKey || !anchorWallet) return null;
    setLoading(true);
    setError(null);
    try {
      const program = getProgram(anchorWallet);
      // agent authority = owner for now (user controls the agent key)
      const { subWalletPDA } = await createOnChain(
        program,
        publicKey,
        name,
        description,
        policy,
        publicKey
      );
      await refresh();
      return wallets.find((w) => w.id === subWalletPDA.toBase58()) ?? null;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Transaction failed");
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function updatePolicy(wallet: SubWallet, policy: PolicyConfig) {
    if (!publicKey || !anchorWallet) return;
    setLoading(true);
    setError(null);
    try {
      const program = getProgram(anchorWallet);
      await updatePolicyOnChain(
        program,
        publicKey,
        new PublicKey(wallet.id),
        policy
      );
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Transaction failed");
    } finally {
      setLoading(false);
    }
  }

  async function togglePause(wallet: SubWallet) {
    if (!publicKey || !anchorWallet) return;
    setLoading(true);
    setError(null);
    try {
      const program = getProgram(anchorWallet);
      await pauseOnChain(
        program,
        publicKey,
        new PublicKey(wallet.id),
        !wallet.isPaused
      );
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Transaction failed");
    } finally {
      setLoading(false);
    }
  }

  // Merge on-chain wallets with localStorage tx history
  const walletsWithTxs = wallets.map((w) => ({
    ...w,
    _transactions: loadTransactions(w.id),
  }));

  return {
    wallets,
    walletsWithTxs,
    loading,
    error,
    create,
    updatePolicy,
    togglePause,
    refresh,
    connected: !!publicKey,
  };
}
