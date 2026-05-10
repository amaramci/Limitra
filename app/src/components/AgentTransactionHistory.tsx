"use client";

import { AgentTx } from "@/hooks/useAgentTransactions";
import { CheckCircle, XCircle, ArrowRight } from "lucide-react";

interface Props {
  txs: AgentTx[];
}

export function AgentTransactionHistory({ txs }: Props) {
  return (
    <div className="space-y-2">
      {txs.map((tx) => {
        const isSell = tx.from_symbol !== "USDC";
        const isBlocked = tx.status === "blocked";
        return (
          <div
            key={tx.id}
            className={`flex items-center gap-3 p-3 rounded-xl border ${
              isBlocked
                ? "bg-loss/5 border-loss/20"
                : "bg-surface-700 border-surface-600"
            }`}
          >
            <div className="flex-shrink-0">
              {tx.status === "success" && <CheckCircle size={15} className="text-profit" />}
              {isBlocked && <XCircle size={15} className="text-loss" />}
              {tx.status === "pending" && <div className="w-4 h-4 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />}
            </div>

            {!isBlocked && (
              <div className="flex items-center gap-1 flex-shrink-0">
                <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${isSell ? "bg-loss/10 text-loss" : "bg-profit/10 text-profit"}`}>
                  {tx.from_symbol}
                </span>
                <ArrowRight size={11} className="text-gray-500" />
                <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${isSell ? "bg-profit/10 text-profit" : "bg-loss/10 text-loss"}`}>
                  {tx.to_symbol}
                </span>
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-mono font-medium">
                ${Number(tx.amount_usd).toFixed(2)}
              </div>
              {isBlocked && tx.blocked_reason && (
                <div className="text-loss text-xs truncate mt-0.5">{tx.blocked_reason}</div>
              )}
              {tx.claude_reasoning && !isBlocked && (
                <div className="text-gray-500 text-xs truncate mt-0.5">{tx.claude_reasoning}</div>
              )}
            </div>

            <div className="text-right flex-shrink-0">
              {tx.tx_signature && tx.status === "success" && !tx.tx_signature.startsWith("sim_") && (
                <a
                  href={`https://solscan.io/tx/${tx.tx_signature}?cluster=devnet`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-brand-400 hover:underline"
                >
                  Solscan
                </a>
              )}
              {tx.tx_signature?.startsWith("sim_") && (
                <span className="text-xs text-gray-600">simulated</span>
              )}
              <div className="text-gray-600 text-xs mt-0.5">
                {new Date(tx.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
