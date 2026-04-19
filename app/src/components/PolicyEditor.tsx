"use client";

import { useState } from "react";
import { PolicyConfig, KNOWN_TOKENS, KNOWN_PROTOCOLS, StrategyTag } from "@/lib/types";
import { Shield, Check, X } from "lucide-react";

interface Props {
  policy: PolicyConfig;
  onSave: (policy: PolicyConfig) => void;
  readOnly?: boolean;
}

const STRATEGY_TAGS: StrategyTag[] = [
  "spot_trading",
  "arbitrage",
  "yield_farming",
  "dca",
  "market_making",
  "custom",
];

export function PolicyEditor({ policy, onSave, readOnly = false }: Props) {
  const [draft, setDraft] = useState<PolicyConfig>(policy);
  const [dirty, setDirty] = useState(false);

  function update(patch: Partial<PolicyConfig>) {
    setDraft((d) => ({ ...d, ...patch }));
    setDirty(true);
  }

  function toggleToken(mint: string) {
    const next = draft.allowedTokens.includes(mint)
      ? draft.allowedTokens.filter((m) => m !== mint)
      : [...draft.allowedTokens, mint];
    update({ allowedTokens: next });
  }

  function toggleProtocol(pid: string) {
    const next = draft.allowedProtocols.includes(pid)
      ? draft.allowedProtocols.filter((p) => p !== pid)
      : [...draft.allowedProtocols, pid];
    update({ allowedProtocols: next });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-white font-semibold">
        <Shield size={16} className="text-brand-400" />
        Policy Configuration
      </div>

      {/* Strategy tag */}
      <div>
        <label className="text-xs text-gray-400 mb-2 block">Strategy type</label>
        <div className="flex flex-wrap gap-2">
          {STRATEGY_TAGS.map((tag) => (
            <button
              key={tag}
              disabled={readOnly}
              onClick={() => update({ strategyTag: tag })}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                draft.strategyTag === tag
                  ? "border-brand-500 bg-brand-500/15 text-brand-400"
                  : "border-surface-500 text-gray-400 hover:border-surface-400"
              } disabled:cursor-default`}
            >
              {tag.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Spending limits */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-gray-400 mb-1.5 block">Daily limit (USDC)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
            <input
              type="number"
              disabled={readOnly}
              value={draft.dailyLimit / 1e6}
              onChange={(e) => update({ dailyLimit: parseFloat(e.target.value) * 1e6 || 0 })}
              className="w-full bg-surface-700 border border-surface-500 rounded-xl pl-7 pr-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500 disabled:cursor-default"
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1.5 block">Max tx size (USDC)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
            <input
              type="number"
              disabled={readOnly}
              value={draft.maxTxSize / 1e6}
              onChange={(e) => update({ maxTxSize: parseFloat(e.target.value) * 1e6 || 0 })}
              className="w-full bg-surface-700 border border-surface-500 rounded-xl pl-7 pr-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500 disabled:cursor-default"
            />
          </div>
        </div>
      </div>

      {/* Token whitelist */}
      <div>
        <label className="text-xs text-gray-400 mb-2 block">
          Allowed tokens ({draft.allowedTokens.length}/10)
        </label>
        <div className="grid grid-cols-3 gap-2">
          {KNOWN_TOKENS.map((token) => {
            const active = draft.allowedTokens.includes(token.mint);
            return (
              <button
                key={token.mint}
                disabled={readOnly}
                onClick={() => toggleToken(token.mint)}
                className={`flex items-center justify-between px-3 py-2 rounded-xl border text-sm transition-colors ${
                  active
                    ? "border-brand-500/50 bg-brand-500/10 text-brand-300"
                    : "border-surface-500 text-gray-500 hover:border-surface-400 hover:text-gray-400"
                } disabled:cursor-default`}
              >
                <span className="font-mono font-medium">{token.symbol}</span>
                {active ? <Check size={13} /> : <X size={13} className="opacity-30" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Protocol whitelist */}
      <div>
        <label className="text-xs text-gray-400 mb-2 block">
          Allowed protocols ({draft.allowedProtocols.length}/10)
        </label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {KNOWN_PROTOCOLS.map((protocol) => {
            const active = draft.allowedProtocols.includes(protocol.programId);
            return (
              <button
                key={protocol.programId}
                disabled={readOnly}
                onClick={() => toggleProtocol(protocol.programId)}
                className={`flex items-center justify-between px-3 py-2 rounded-xl border text-sm transition-colors ${
                  active
                    ? "border-brand-500/50 bg-brand-500/10 text-brand-300"
                    : "border-surface-500 text-gray-500 hover:border-surface-400 hover:text-gray-400"
                } disabled:cursor-default`}
              >
                <span>{protocol.name}</span>
                {active ? <Check size={13} /> : <X size={13} className="opacity-30" />}
              </button>
            );
          })}
        </div>
      </div>

      {!readOnly && dirty && (
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => { onSave(draft); setDirty(false); }}
            className="flex-1 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-medium transition-colors"
          >
            Save policy
          </button>
          <button
            onClick={() => { setDraft(policy); setDirty(false); }}
            className="px-4 py-2.5 border border-surface-500 text-gray-400 hover:text-white rounded-xl text-sm transition-colors"
          >
            Reset
          </button>
        </div>
      )}
    </div>
  );
}
