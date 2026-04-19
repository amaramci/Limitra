"use client";

import { use } from "react";
import Link from "next/link";
import { MOCK_SUB_WALLETS, MOCK_TRANSACTIONS, getMockPerformance } from "@/lib/mock-data";
import { AgentChat } from "@/components/AgentChat";
import { PolicyEditor } from "@/components/PolicyEditor";
import { TransactionHistory } from "@/components/TransactionHistory";
import { PolicyConfig } from "@/lib/types";
import { useState } from "react";
import {
  Shield,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart2,
  MessageSquare,
  Settings,
  Pause,
  Play,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function AgentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const walletData = MOCK_SUB_WALLETS.find((w) => w.id === id);
  const [wallet, setWallet] = useState(walletData);
  const [activeTab, setActiveTab] = useState<"chat" | "history" | "policy">("chat");

  if (!wallet) {
    return (
      <div className="min-h-screen bg-surface-900 flex items-center justify-center text-gray-400">
        Agent not found.{" "}
        <Link href="/dashboard" className="text-brand-400 ml-1">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const perf = getMockPerformance(wallet.id);
  const transactions = MOCK_TRANSACTIONS.filter((t) => t.subWalletId === wallet.id);
  const pnl = wallet.realizedPnl / 1e6;

  function handleSavePolicy(p: PolicyConfig) {
    setWallet((w) => w ? { ...w, policy: p } : w);
  }

  function togglePause() {
    setWallet((w) => w ? { ...w, isPaused: !w.isPaused } : w);
  }

  return (
    <div className="min-h-screen bg-surface-900 flex flex-col">
      {/* Header */}
      <header className="border-b border-surface-700 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-brand-500/20 border border-brand-500/40 rounded-lg flex items-center justify-center">
              <Shield size={13} className="text-brand-400" />
            </div>
            <span className="text-gray-400 text-sm">SmartAllowance</span>
          </div>
          <span className="text-gray-600">/</span>
          <span className="text-white font-medium">{wallet.name}</span>
          {wallet.isPaused && (
            <span className="text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full">
              Paused
            </span>
          )}
        </div>
        <button
          onClick={togglePause}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm transition-colors border ${
            wallet.isPaused
              ? "bg-brand-500/10 text-brand-400 border-brand-500/20 hover:bg-brand-500/20"
              : "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20"
          }`}
        >
          {wallet.isPaused ? <Play size={13} /> : <Pause size={13} />}
          {wallet.isPaused ? "Resume" : "Pause"} agent
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar — stats */}
        <div className="w-80 border-r border-surface-700 overflow-y-auto flex-shrink-0 p-5 space-y-5">
          {/* P&L */}
          <div className="bg-surface-800 border border-surface-600 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
              {pnl >= 0 ? <TrendingUp size={12} className="text-brand-400" /> : <TrendingDown size={12} className="text-red-400" />}
              Realized P&L
            </div>
            <div className={`text-2xl font-bold font-mono ${pnl >= 0 ? "text-brand-400" : "text-red-400"}`}>
              {pnl >= 0 ? "+" : ""}${Math.abs(pnl).toFixed(2)}
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Trades", value: wallet.totalTransactions.toString(), icon: <Activity size={12} /> },
              { label: "Win rate", value: `${perf.winRate.toFixed(0)}%`, icon: <BarChart2 size={12} /> },
              { label: "Best trade", value: `+$${perf.bestTrade.toFixed(2)}`, icon: <TrendingUp size={12} /> },
              { label: "Worst trade", value: `$${perf.worstTrade.toFixed(2)}`, icon: <TrendingDown size={12} /> },
            ].map((s) => (
              <div key={s.label} className="bg-surface-800 border border-surface-600 rounded-xl p-3">
                <div className="flex items-center gap-1 text-gray-500 text-xs mb-1">
                  {s.icon}
                  {s.label}
                </div>
                <div className="text-white font-mono font-semibold text-sm">{s.value}</div>
              </div>
            ))}
          </div>

          {/* Daily limit */}
          <div className="bg-surface-800 border border-surface-600 rounded-2xl p-4">
            <div className="flex justify-between text-xs text-gray-400 mb-2">
              <span>Daily limit</span>
              <span className="font-mono">${(wallet.dailySpent / 1e6).toFixed(0)} / ${(wallet.policy.dailyLimit / 1e6).toFixed(0)}</span>
            </div>
            <div className="h-2 bg-surface-600 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${(wallet.dailySpent / wallet.policy.dailyLimit) > 0.8 ? "bg-amber-400" : "bg-brand-500"}`}
                style={{ width: `${Math.min((wallet.dailySpent / wallet.policy.dailyLimit) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Mini P&L chart */}
          <div className="bg-surface-800 border border-surface-600 rounded-2xl p-4">
            <div className="text-xs text-gray-400 mb-3">30d P&L</div>
            <ResponsiveContainer width="100%" height={80}>
              <AreaChart data={perf.dailyPnlHistory} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={pnl >= 0 ? "#22c55e" : "#ef4444"} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={pnl >= 0 ? "#22c55e" : "#ef4444"} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a27" />
                <Area
                  type="monotone"
                  dataKey="cumPnl"
                  stroke={pnl >= 0 ? "#22c55e" : "#ef4444"}
                  fill="url(#pnlGrad)"
                  strokeWidth={1.5}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Description */}
          <div className="bg-surface-800 border border-surface-600 rounded-2xl p-4">
            <div className="text-xs text-gray-400 mb-2">Strategy</div>
            <p className="text-gray-300 text-xs leading-relaxed">{wallet.agentDescription}</p>
          </div>
        </div>

        {/* Main panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-surface-700 px-4 flex-shrink-0">
            {[
              { id: "chat", label: "Chat", icon: <MessageSquare size={13} /> },
              { id: "history", label: "Transactions", icon: <Activity size={13} /> },
              { id: "policy", label: "Policy", icon: <Settings size={13} /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-3 text-sm border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-brand-500 text-brand-400"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === "chat" && <AgentChat wallet={wallet} />}
            {activeTab === "history" && (
              <div className="p-5 overflow-y-auto h-full">
                <TransactionHistory transactions={transactions} />
              </div>
            )}
            {activeTab === "policy" && (
              <div className="p-5 overflow-y-auto h-full max-w-lg">
                <PolicyEditor policy={wallet.policy} onSave={handleSavePolicy} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
