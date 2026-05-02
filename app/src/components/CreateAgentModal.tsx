"use client";

import { useState } from "react";
import { PolicyConfig, KNOWN_TOKENS, KNOWN_PROTOCOLS, StrategyTag } from "@/lib/types";
import { X, Check, Loader2 } from "lucide-react";

interface Props {
  onClose: () => void;
  onCreate: (name: string, description: string, policy: PolicyConfig, agentPubkey: string, tempId: string) => Promise<void>;
}

const DEFAULT_POLICY: PolicyConfig = {
  allowedTokens: [
    "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "So11111111111111111111111111111111111111112",
  ],
  allowedProtocols: ["JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4"],
  dailyLimit: 100_000_000,
  maxTxSize: 25_000_000,
  strategyTag: "spot_trading",
};

const STRATEGY_OPTIONS: { value: StrategyTag; label: string }[] = [
  { value: "spot_trading", label: "Spot trading" },
  { value: "arbitrage", label: "Arbitrage" },
  { value: "yield_farming", label: "Yield farming" },
  { value: "dca", label: "DCA" },
  { value: "market_making", label: "Market making" },
  { value: "custom", label: "Custom" },
];

export function CreateAgentModal({ onClose, onCreate }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [policy, setPolicy] = useState<PolicyConfig>(DEFAULT_POLICY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleToken(mint: string) {
    setPolicy((p) => ({
      ...p,
      allowedTokens: p.allowedTokens.includes(mint)
        ? p.allowedTokens.filter((m) => m !== mint)
        : [...p.allowedTokens, mint],
    }));
  }

  function toggleProtocol(pid: string) {
    setPolicy((p) => ({
      ...p,
      allowedProtocols: p.allowedProtocols.includes(pid)
        ? p.allowedProtocols.filter((m) => m !== pid)
        : [...p.allowedProtocols, pid],
    }));
  }

  async function handleSubmit() {
    if (!name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      // 1. Generate server-side keypair
      const res = await fetch("/api/agents/prepare", { method: "POST" });
      if (!res.ok) throw new Error("Failed to generate agent keypair");
      const { tempId, agentPubkey } = await res.json();
      // 2. Pass to parent — parent builds Anchor tx, signs in Phantom, then calls /api/agents/finalize
      await onCreate(name.trim(), description.trim(), policy, agentPubkey, tempId);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface-800 border border-surface-600 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-surface-600">
          <h2 className="text-white font-semibold">New AI agent</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Name */}
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Agent name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alpha Scalper"
              maxLength={32}
              className="w-full bg-surface-700 border border-surface-500 rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Strategy description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this agent does, e.g. 'SOL/USDC spot trading, buys dips >2%, sells at +1.5%'"
              rows={2}
              maxLength={128}
              className="w-full bg-surface-700 border border-surface-500 rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-brand-500 resize-none"
            />
          </div>

          {/* Strategy type */}
          <div>
            <label className="text-xs text-gray-400 mb-2 block">Strategy type</label>
            <div className="flex flex-wrap gap-2">
              {STRATEGY_OPTIONS.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setPolicy((p) => ({ ...p, strategyTag: s.value }))}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                    policy.strategyTag === s.value
                      ? "border-brand-500 bg-brand-500/15 text-brand-400"
                      : "border-surface-500 text-gray-400 hover:border-surface-400"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Limits */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Daily limit (USDC)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                <input
                  type="number"
                  min={1}
                  value={policy.dailyLimit / 1e6}
                  onChange={(e) => setPolicy((p) => ({ ...p, dailyLimit: parseFloat(e.target.value) * 1e6 || 0 }))}
                  className="w-full bg-surface-700 border border-surface-500 rounded-xl pl-7 pr-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Max tx size (USDC)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                <input
                  type="number"
                  min={1}
                  value={policy.maxTxSize / 1e6}
                  onChange={(e) => setPolicy((p) => ({ ...p, maxTxSize: parseFloat(e.target.value) * 1e6 || 0 }))}
                  className="w-full bg-surface-700 border border-surface-500 rounded-xl pl-7 pr-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>
          </div>

          {/* Allowed tokens */}
          <div>
            <label className="text-xs text-gray-400 mb-2 block">Allowed tokens</label>
            <div className="grid grid-cols-3 gap-2">
              {KNOWN_TOKENS.map((t) => {
                const active = policy.allowedTokens.includes(t.mint);
                return (
                  <button
                    key={t.mint}
                    type="button"
                    onClick={() => toggleToken(t.mint)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl border text-sm transition-colors ${
                      active
                        ? "border-brand-500/50 bg-brand-500/10 text-brand-400"
                        : "border-surface-500 text-gray-500 hover:border-surface-400 hover:text-gray-300"
                    }`}
                  >
                    <span className="font-mono font-medium">{t.symbol}</span>
                    {active && <Check size={12} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Allowed protocols */}
          <div>
            <label className="text-xs text-gray-400 mb-2 block">Allowed protocols</label>
            <div className="grid grid-cols-2 gap-2">
              {KNOWN_PROTOCOLS.map((p) => {
                const active = policy.allowedProtocols.includes(p.programId);
                return (
                  <button
                    key={p.programId}
                    type="button"
                    onClick={() => toggleProtocol(p.programId)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl border text-sm transition-colors ${
                      active
                        ? "border-brand-500/50 bg-brand-500/10 text-brand-400"
                        : "border-surface-500 text-gray-500 hover:border-surface-400 hover:text-gray-300"
                    }`}
                  >
                    <span>{p.name}</span>
                    {active && <Check size={12} />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        {error && (
          <div className="px-5 pb-2 text-loss text-xs">{error}</div>
        )}
        <div className="flex gap-3 p-5 border-t border-surface-600">
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || policy.allowedTokens.length === 0 || submitting}
            className="flex-1 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            {submitting ? "Creating…" : "Create agent"}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 border border-surface-500 text-gray-400 hover:text-white rounded-xl text-sm transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
