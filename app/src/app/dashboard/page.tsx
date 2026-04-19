"use client";

import { useState } from "react";
import Link from "next/link";
import { MOCK_SUB_WALLETS, MOCK_TRANSACTIONS, getMockPerformance } from "@/lib/mock-data";
import { SubWalletCard } from "@/components/SubWalletCard";
import { TransactionHistory } from "@/components/TransactionHistory";
import {
  Shield,
  TrendingUp,
  TrendingDown,
  Activity,
  XCircle,
  Plus,
  ArrowLeft,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "transactions">("overview");

  const totalPnl = MOCK_SUB_WALLETS.reduce((s, w) => s + w.realizedPnl / 1e6, 0);
  const totalTxs = MOCK_SUB_WALLETS.reduce((s, w) => s + w.totalTransactions, 0);
  const blockedTxs = MOCK_TRANSACTIONS.filter((t) => t.status === "blocked").length;
  const activeAgents = MOCK_SUB_WALLETS.filter((w) => !w.isPaused).length;

  // Merge daily P&L histories for chart
  const perf0 = getMockPerformance("sw-1");
  const perf1 = getMockPerformance("sw-2");
  const perf2 = getMockPerformance("sw-3");
  const chartData = perf0.dailyPnlHistory.map((d, i) => ({
    date: d.date,
    "Alpha Scalper": d.cumPnl,
    "Arb Hunter": perf1.dailyPnlHistory[i]?.cumPnl ?? 0,
    "Yield Farmer": perf2.dailyPnlHistory[i]?.cumPnl ?? 0,
  }));

  return (
    <div className="min-h-screen bg-surface-900">
      {/* Header */}
      <header className="border-b border-surface-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-brand-500/20 border border-brand-500/40 rounded-lg flex items-center justify-center">
              <Shield size={13} className="text-brand-400" />
            </div>
            <span className="font-semibold text-white">SmartAllowance</span>
          </div>
          <span className="text-gray-600">/</span>
          <span className="text-gray-400 text-sm">Dashboard</span>
        </div>
        <button className="flex items-center gap-2 px-3 py-1.5 bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/20 rounded-xl text-sm transition-colors">
          <Plus size={13} />
          New agent
        </button>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: "Total P&L",
              value: `${totalPnl >= 0 ? "+" : ""}$${Math.abs(totalPnl).toFixed(2)}`,
              icon: totalPnl >= 0 ? <TrendingUp size={16} className="text-brand-400" /> : <TrendingDown size={16} className="text-red-400" />,
              color: totalPnl >= 0 ? "text-brand-400" : "text-red-400",
            },
            {
              label: "Active agents",
              value: `${activeAgents} / ${MOCK_SUB_WALLETS.length}`,
              icon: <Activity size={16} className="text-blue-400" />,
              color: "text-white",
            },
            {
              label: "Total trades",
              value: totalTxs.toString(),
              icon: <Activity size={16} className="text-purple-400" />,
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: agents */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-white font-semibold">AI Agents</h2>
            {MOCK_SUB_WALLETS.map((w) => (
              <SubWalletCard key={w.id} wallet={w} />
            ))}
          </div>

          {/* Right: chart + transactions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cumulative P&L chart */}
            <div className="bg-surface-800 border border-surface-600 rounded-2xl p-5">
              <h2 className="text-white font-semibold mb-4">Cumulative P&L — 30 days</h2>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a27" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: "#6b7280" }}
                    tickLine={false}
                    interval={6}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#6b7280" }}
                    tickLine={false}
                    tickFormatter={(v) => `$${v.toFixed(0)}`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#111118",
                      border: "1px solid #22223a",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                    formatter={(v: number) => [`$${v.toFixed(2)}`, ""]}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <Line type="monotone" dataKey="Alpha Scalper" stroke="#22c55e" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Arb Hunter" stroke="#ef4444" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Yield Farmer" stroke="#3b82f6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Recent transactions */}
            <div className="bg-surface-800 border border-surface-600 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-semibold">Recent activity</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab("overview")}
                    className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${activeTab === "overview" ? "bg-brand-500/15 text-brand-400" : "text-gray-400 hover:text-white"}`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setActiveTab("transactions")}
                    className={`text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${activeTab === "transactions" ? "bg-red-500/15 text-red-400" : "text-gray-400 hover:text-white"}`}
                  >
                    <XCircle size={10} />
                    Blocked only
                  </button>
                </div>
              </div>
              <TransactionHistory
                transactions={
                  activeTab === "transactions"
                    ? MOCK_TRANSACTIONS.filter((t) => t.status === "blocked")
                    : MOCK_TRANSACTIONS
                }
                compact
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
