import Link from "next/link";
import { Shield, Zap, BarChart2, Bot, ArrowRight, Lock } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-surface-900 text-white">
      {/* Nav */}
      <nav className="border-b border-surface-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-500/20 border border-brand-500/40 rounded-lg flex items-center justify-center">
            <Shield size={16} className="text-brand-400" />
          </div>
          <span className="font-semibold text-white">SmartAllowance</span>
        </div>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-medium transition-colors"
        >
          Open Dashboard
          <ArrowRight size={14} />
        </Link>
      </nav>

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-6 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 text-xs text-brand-400 bg-brand-500/10 border border-brand-500/20 px-3 py-1.5 rounded-full mb-6">
          <Zap size={11} />
          Built on Solana · Powered by Claude AI
        </div>
        <h1 className="text-5xl font-bold mb-6 leading-tight">
          Give your AI agents{" "}
          <span className="text-brand-400">spending power</span>
          <br />
          without giving them{" "}
          <span className="text-red-400">your wallet</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-10">
          Create restricted sub-wallets for each AI agent or strategy. Define exactly what tokens
          they can trade, which protocols they can use, and how much they can spend — enforced
          on-chain by a Solana smart contract.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-medium transition-colors"
          >
            View Demo Dashboard
            <ArrowRight size={15} />
          </Link>
          <a
            href="https://github.com/your-repo/smart-allowance-wallet"
            className="flex items-center gap-2 px-6 py-3 border border-surface-500 text-gray-300 hover:text-white hover:border-surface-400 rounded-xl font-medium transition-colors"
          >
            View on GitHub
          </a>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-5xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: <Lock size={20} className="text-brand-400" />,
              title: "On-chain enforcement",
              desc: "Policy restrictions are validated by the Solana smart contract, not client-side code. Agents literally cannot exceed their limits.",
            },
            {
              icon: <Bot size={20} className="text-brand-400" />,
              title: "Claude AI agents",
              desc: "Each sub-wallet has a Claude-powered agent that trades within its assigned policy. Chat with your agents to understand their decisions.",
            },
            {
              icon: <Shield size={20} className="text-brand-400" />,
              title: "Granular permissions",
              desc: "Whitelist specific tokens, protocols (DEXs, lending), daily limits, and max transaction sizes per agent.",
            },
            {
              icon: <BarChart2 size={20} className="text-brand-400" />,
              title: "Performance dashboard",
              desc: "Track P&L per agent, see blocked transactions, compare strategies, and get AI-powered suggestions for tuning parameters.",
            },
          ].map((f) => (
            <div key={f.title} className="bg-surface-800 border border-surface-600 rounded-2xl p-5">
              <div className="w-10 h-10 bg-brand-500/10 border border-brand-500/20 rounded-xl flex items-center justify-center mb-3">
                {f.icon}
              </div>
              <h3 className="text-white font-semibold mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold mb-10">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: "Create a sub-wallet",
                desc: "Define a policy: which tokens, which protocols, daily budget, and max per trade. Each sub-wallet is a PDA on Solana.",
              },
              {
                step: "02",
                title: "Assign a Claude agent",
                desc: "Your AI agent gets a keypair tied to the sub-wallet. Its tools are pre-filtered by policy — it cannot call execute_swap with forbidden tokens.",
              },
              {
                step: "03",
                title: "Monitor & optimize",
                desc: "Watch the dashboard. Agent loses $50 on arb? Tighten the tx limit. Agent crushing it? Raise the daily cap to scale up.",
              },
            ].map((s) => (
              <div key={s.step} className="bg-surface-800 border border-surface-600 rounded-2xl p-6 text-left">
                <div className="text-4xl font-bold text-brand-500/30 font-mono mb-3">{s.step}</div>
                <h3 className="text-white font-semibold mb-2">{s.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
