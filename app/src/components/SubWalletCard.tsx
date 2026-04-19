"use client";

import { SubWallet, KNOWN_TOKENS, KNOWN_PROTOCOLS } from "@/lib/types";
import { TrendingUp, TrendingDown, Pause, Zap, Shield, MessageSquare } from "lucide-react";
import Link from "next/link";

interface Props {
  wallet: SubWallet;
}

const STRATEGY_COLORS: Record<string, string> = {
  spot_trading: "text-blue-400 bg-blue-400/10",
  arbitrage: "text-purple-400 bg-purple-400/10",
  yield_farming: "text-green-400 bg-green-400/10",
  dca: "text-yellow-400 bg-yellow-400/10",
  market_making: "text-orange-400 bg-orange-400/10",
  custom: "text-gray-400 bg-gray-400/10",
};

export function SubWalletCard({ wallet }: Props) {
  const pnl = wallet.realizedPnl / 1e6;
  const pnlPositive = pnl >= 0;
  const dailyPct = (wallet.dailySpent / wallet.policy.dailyLimit) * 100;
  const allowedSymbols = wallet.policy.allowedTokens
    .map((m) => KNOWN_TOKENS.find((t) => t.mint === m)?.symbol ?? m.slice(0, 6))
    .slice(0, 3);
  const allowedProtocolNames = wallet.policy.allowedProtocols
    .map((p) => KNOWN_PROTOCOLS.find((k) => k.programId === p)?.name ?? p.slice(0, 6))
    .slice(0, 2);

  return (
    <div className={`relative rounded-2xl border bg-surface-800 p-5 flex flex-col gap-4 transition-all hover:border-surface-500 ${wallet.isPaused ? "border-surface-600 opacity-75" : "border-surface-600 hover:shadow-lg hover:shadow-brand-500/5"}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${STRATEGY_COLORS[wallet.policy.strategyTag]}`}>
              <Zap size={10} />
              {wallet.policy.strategyTag.replace("_", " ")}
            </span>
            {wallet.isPaused && (
              <span className="inline-flex items-center gap-1 text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
                <Pause size={10} />
                Paused
              </span>
            )}
          </div>
          <h3 className="text-white font-semibold text-base truncate">{wallet.name}</h3>
          <p className="text-gray-400 text-xs mt-0.5 line-clamp-2">{wallet.agentDescription}</p>
        </div>
        <div className={`text-right flex-shrink-0 ${pnlPositive ? "text-brand-400" : "text-red-400"}`}>
          <div className="flex items-center gap-1 justify-end">
            {pnlPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span className="text-lg font-bold font-mono">
              {pnlPositive ? "+" : ""}${Math.abs(pnl).toFixed(2)}
            </span>
          </div>
          <div className="text-xs text-gray-500">Total P&L</div>
        </div>
      </div>

      {/* Daily limit progress */}
      <div>
        <div className="flex justify-between text-xs text-gray-400 mb-1.5">
          <span>Daily spend</span>
          <span className="font-mono">
            ${(wallet.dailySpent / 1e6).toFixed(0)} / ${(wallet.policy.dailyLimit / 1e6).toFixed(0)}
          </span>
        </div>
        <div className="h-1.5 bg-surface-600 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${dailyPct > 80 ? "bg-amber-400" : "bg-brand-500"}`}
            style={{ width: `${Math.min(dailyPct, 100)}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-surface-700 rounded-xl p-3 text-center">
          <div className="text-white font-mono font-semibold text-sm">{wallet.totalTransactions}</div>
          <div className="text-gray-500 text-xs mt-0.5">Trades</div>
        </div>
        <div className="bg-surface-700 rounded-xl p-3 text-center">
          <div className="text-white font-mono font-semibold text-sm">${(wallet.policy.maxTxSize / 1e6).toFixed(0)}</div>
          <div className="text-gray-500 text-xs mt-0.5">Max tx</div>
        </div>
        <div className="bg-surface-700 rounded-xl p-3 text-center">
          <div className="text-white font-mono font-semibold text-sm">${(wallet.policy.dailyLimit / 1e6).toFixed(0)}</div>
          <div className="text-gray-500 text-xs mt-0.5">Daily cap</div>
        </div>
      </div>

      {/* Allowed tokens + protocols */}
      <div className="flex flex-wrap gap-1.5">
        <Shield size={12} className="text-gray-500 mt-0.5 flex-shrink-0" />
        {allowedSymbols.map((s) => (
          <span key={s} className="text-xs text-gray-300 bg-surface-700 px-2 py-0.5 rounded-md font-mono">
            {s}
          </span>
        ))}
        <span className="text-gray-600 text-xs self-center">·</span>
        {allowedProtocolNames.map((p) => (
          <span key={p} className="text-xs text-gray-400 bg-surface-700 px-2 py-0.5 rounded-md">
            {p}
          </span>
        ))}
      </div>

      {/* Actions */}
      <Link
        href={`/agent/${wallet.id}`}
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 text-sm font-medium transition-colors border border-brand-500/20 hover:border-brand-500/40"
      >
        <MessageSquare size={14} />
        Chat with agent
      </Link>
    </div>
  );
}
