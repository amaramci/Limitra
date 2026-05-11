"use client";

import { useState } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSubWallets } from "@/hooks/useSubWallets";
import { useSolanaBalances } from "@/hooks/useSolanaBalances";
import { SubWalletCard } from "@/components/SubWalletCard";
import { AgentTransactionHistory } from "@/components/AgentTransactionHistory";
import { WalletButton } from "@/components/WalletButton";
import { CreateAgentModal } from "@/components/CreateAgentModal";
import { useAgentTransactions } from "@/hooks/useAgentTransactions";
import { explorerAccount } from "@/lib/program";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  XCircle,
  Plus,
  ArrowLeft,
  Wallet,
  Loader2,
  ExternalLink,
} from "lucide-react";

export default function DashboardPage() {
  const { publicKey } = useWallet();
  const { wallets, loading, error, create, updatePolicy } = useSubWallets();
  const { sol, tokens } = useSolanaBalances();
  const [showCreate, setShowCreate] = useState(false);

  const walletIds = wallets.map((w) => w.id);
  const { txs: agentTxs } = useAgentTransactions(walletIds);

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayTxs = agentTxs.filter((t) => t.status === "success" && new Date(t.created_at) >= todayStart);

  const dailySpentByWallet = todayTxs.reduce<Record<string, number>>((acc, t) => {
    acc[t.sub_wallet_id] = (acc[t.sub_wallet_id] ?? 0) + Number(t.amount_usd);
    return acc;
  }, {});

  const tradeCountByWallet = agentTxs.filter((t) => t.status === "success").reduce<Record<string, number>>((acc, t) => {
    acc[t.sub_wallet_id] = (acc[t.sub_wallet_id] ?? 0) + 1;
    return acc;
  }, {});

  const totalPnl = 0; // tracked on-chain; simulated swaps have no real PnL
  const totalTxs = agentTxs.length;
  const blockedTxs = agentTxs.filter((t) => t.status === "blocked").length;
  const activeAgents = wallets.filter((w) => !w.isPaused).length;

  return (
    <div className="min-h-screen bg-surface-900">
      <header className="border-b border-surface-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="logo" className="w-7 h-7" />
            <span className="font-semibold text-white">SmartAllowance</span>
          </div>
          <span className="text-gray-600">/</span>
          <span className="text-gray-400 text-sm">Dashboard</span>
        </div>
        <div className="flex items-center gap-2">
          {publicKey && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/20 rounded-xl text-sm transition-colors"
            >
              <Plus size={13} />
              New agent
            </button>
          )}
          <WalletButton />
        </div>
      </header>

      {!publicKey && (
        <div className="flex flex-col items-center justify-center py-32 px-6 text-center">
          <div className="w-14 h-14 bg-surface-800 border border-surface-600 rounded-2xl flex items-center justify-center mb-4">
            <Wallet size={24} className="text-gray-500" />
          </div>
          <h2 className="text-white font-semibold text-lg mb-2">Connect your wallet</h2>
          <p className="text-gray-400 text-sm max-w-xs mb-6">
            Connect Phantom or Solflare to manage your AI agent sub-wallets on Solana devnet.
          </p>
          <WalletButton />
        </div>
      )}

      {publicKey && (
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Main wallet balance bar */}
          <div className="flex items-center gap-4 mb-6 p-3 bg-surface-800 border border-surface-600 rounded-xl text-sm flex-wrap">
            <span className="text-gray-500 text-xs">Main wallet</span>
            <a
              href={explorerAccount(publicKey.toBase58())}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-gray-400 hover:text-white text-xs flex items-center gap-1 transition-colors"
            >
              {publicKey.toBase58().slice(0, 8)}…{publicKey.toBase58().slice(-6)}
              <ExternalLink size={10} />
            </a>
            {sol !== null && (
              <span className="font-mono text-gray-200">
                {sol.toFixed(4)} <span className="text-gray-500">SOL</span>
              </span>
            )}
            {tokens.map((t) => (
              <span key={t.mint} className="font-mono text-gray-200">
                {t.amount.toFixed(2)} <span className="text-gray-500">{t.symbol}</span>
              </span>
            ))}
          </div>

          {error && (
            <div className="mb-6 p-3 bg-loss/10 border border-loss/30 rounded-xl text-loss text-sm">
              {error}
            </div>
          )}

          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              {
                label: "Total P&L",
                value: `${totalPnl >= 0 ? "+" : ""}$${Math.abs(totalPnl).toFixed(2)}`,
                icon: totalPnl >= 0
                  ? <TrendingUp size={16} className="text-profit" />
                  : <TrendingDown size={16} className="text-loss" />,
                color: totalPnl >= 0 ? "text-profit" : "text-loss",
              },
              {
                label: "Active agents",
                value: loading ? "…" : `${activeAgents} / ${wallets.length}`,
                icon: <Activity size={16} className="text-brand-400" />,
                color: "text-white",
              },
              {
                label: "Total trades",
                value: totalTxs.toString(),
                icon: <Activity size={16} className="text-gray-400" />,
                color: "text-white",
              },
              {
                label: "Blocked by policy",
                value: blockedTxs.toString(),
                icon: <XCircle size={16} className="text-amber-400" />,
                color: "text-amber-400",
              },
            ].map((kpi) => (
              <div key={kpi.label} className="bg-surface-800 border border-surface-600 rounded-2xl p-5">
                <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
                  {kpi.icon}
                  {kpi.label}
                </div>
                <div className={`text-2xl font-bold font-mono ${kpi.color}`}>{kpi.value}</div>
              </div>
            ))}
          </div>

          {/* Loading state */}
          {loading && wallets.length === 0 && (
            <div className="flex items-center justify-center py-24 gap-2 text-gray-400">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">Fetching on-chain accounts…</span>
            </div>
          )}

          {/* Empty state */}
          {!loading && wallets.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-14 h-14 bg-surface-800 border border-surface-700 rounded-2xl flex items-center justify-center mb-4">
                <Plus size={22} className="text-gray-600" />
              </div>
              <h3 className="text-white font-medium mb-2">No agents yet</h3>
              <p className="text-gray-500 text-sm max-w-xs mb-5">
                Create your first AI agent. The policy is stored on Solana. Your agent cannot go over its limits.
              </p>
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-medium transition-colors"
              >
                <Plus size={14} />
                Create first agent
              </button>
            </div>
          )}

          {wallets.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-4">
                <h2 className="text-gray-400 font-semibold text-xs uppercase tracking-wider">
                  Agents ({wallets.length})
                </h2>
                {wallets.map((w) => (
                  <SubWalletCard
                    key={w.id}
                    wallet={w}
                    onUpdatePolicy={updatePolicy}
                    dailySpentOverride={dailySpentByWallet[w.id] ?? 0}
                    tradeCountOverride={tradeCountByWallet[w.id] ?? 0}
                  />
                ))}
              </div>
              <div className="lg:col-span-2">
                <div className="bg-surface-800 border border-surface-600 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-white font-semibold text-sm">Recent activity</h2>
                    <span className="text-gray-500 text-xs">{agentTxs.length} transactions</span>
                  </div>
                  {agentTxs.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-12">
                      No transactions yet. Agent will trade automatically.
                    </p>
                  ) : (
                    <AgentTransactionHistory txs={agentTxs} />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {showCreate && (
        <CreateAgentModal
          onClose={() => setShowCreate(false)}
          onCreate={(name, desc, policy, agentPubkey, tempId) =>
            create(name, desc, policy, agentPubkey, tempId)
          }
        />
      )}
    </div>
  );
}
