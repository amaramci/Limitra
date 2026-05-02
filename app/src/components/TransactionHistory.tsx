"use client";

import { Transaction } from "@/lib/types";
import { CheckCircle, XCircle, Clock, TrendingUp, TrendingDown } from "lucide-react";

interface Props {
  transactions: Transaction[];
  compact?: boolean;
}

export function TransactionHistory({ transactions, compact = false }: Props) {
  const sorted = [...transactions].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="space-y-2">
      {sorted.length === 0 && (
        <div className="text-center text-gray-500 text-sm py-8">No transactions yet</div>
      )}
      {sorted.map((tx) => (
        <div
          key={tx.id}
          className={`flex items-center gap-3 p-3 rounded-xl bg-surface-700 border ${
            tx.status === "blocked"
              ? "border-loss/20 bg-loss/5"
              : "border-surface-600"
          }`}
        >
          {/* Status icon */}
          <div className="flex-shrink-0">
            {tx.status === "success" && <CheckCircle size={16} className="text-profit" />}
            {tx.status === "blocked" && <XCircle size={16} className="text-loss" />}
            {tx.status === "pending" && <Clock size={16} className="text-amber-400" />}
          </div>

          {/* Direction badge */}
          {tx.status !== "blocked" && (
            <span
              className={`text-xs font-mono px-1.5 py-0.5 rounded font-semibold flex-shrink-0 ${
                tx.direction === "buy"
                  ? "bg-profit/10 text-profit"
                  : "bg-loss/10 text-loss"
              }`}
            >
              {tx.direction?.toUpperCase()}
            </span>
          )}

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-white text-sm font-mono font-medium">
                ${tx.amountUsd.toFixed(0)} {tx.tokenSymbol}
              </span>
              {!compact && (
                <span className="text-gray-500 text-xs">via {tx.protocol}</span>
              )}
            </div>
            {tx.status === "blocked" && (
              <div className="text-loss text-xs mt-0.5 truncate">{tx.blockedReason}</div>
            )}
            {tx.memo && tx.status !== "blocked" && !compact && (
              <div className="text-gray-500 text-xs mt-0.5 truncate">{tx.memo}</div>
            )}
          </div>

          {/* P&L */}
          <div className="text-right flex-shrink-0">
            {tx.pnl != null && (
              <div className={`flex items-center gap-1 text-xs font-mono ${tx.pnl >= 0 ? "text-profit" : "text-loss"}`}>
                {tx.pnl >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {tx.pnl >= 0 ? "+" : ""}${(tx.pnl / 1e6).toFixed(2)}
              </div>
            )}
            <div className="text-gray-600 text-xs">
              {new Date(tx.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
