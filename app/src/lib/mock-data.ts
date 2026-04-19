import { SubWallet, Transaction, AgentPerformance } from "./types";

function daysAgo(n: number) {
  return Date.now() - n * 86_400_000;
}

export const MOCK_SUB_WALLETS: SubWallet[] = [
  {
    id: "sw-1",
    address: "AgentA11111111111111111111111111111111111111",
    name: "Alpha Scalper",
    agentDescription:
      "High-frequency SOL/USDC spot trading. Buys dips >2%, sells at +1.5%. Runs 24/7 on Raydium and Jupiter.",
    agentAuthority: "Auth1111111111111111111111111111111111111111",
    policy: {
      allowedTokens: [
        "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        "So11111111111111111111111111111111111111112",
      ],
      allowedProtocols: [
        "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4",
        "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8",
      ],
      dailyLimit: 500_000_000,  // $500 USDC
      maxTxSize: 100_000_000,   // $100 USDC
      strategyTag: "spot_trading",
    },
    dailySpent: 187_000_000,
    lastResetTimestamp: Math.floor(daysAgo(0) / 1000),
    totalTransactions: 312,
    realizedPnl: 143_720_000,   // +$143.72
    isPaused: false,
    index: 0,
    createdAt: daysAgo(30),
  },
  {
    id: "sw-2",
    address: "AgentB22222222222222222222222222222222222222",
    name: "Arb Hunter",
    agentDescription:
      "Cross-DEX arbitrage on SOL/USDT and JUP/USDC pairs. Caps each arb at $200 to limit slippage exposure.",
    agentAuthority: "Auth2222222222222222222222222222222222222222",
    policy: {
      allowedTokens: [
        "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        "So11111111111111111111111111111111111111112",
        "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
        "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
      ],
      allowedProtocols: [
        "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4",
        "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8",
        "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc",
      ],
      dailyLimit: 1_000_000_000, // $1000
      maxTxSize: 200_000_000,    // $200
      strategyTag: "arbitrage",
    },
    dailySpent: 620_000_000,
    lastResetTimestamp: Math.floor(daysAgo(0) / 1000),
    totalTransactions: 89,
    realizedPnl: -22_450_000,   // -$22.45 (struggling)
    isPaused: false,
    index: 1,
    createdAt: daysAgo(14),
  },
  {
    id: "sw-3",
    address: "AgentC33333333333333333333333333333333333333",
    name: "Yield Farmer",
    agentDescription:
      "Liquidity provision and yield farming exclusively on Kamino and Marinade. Conservative strategy, no speculative trades.",
    agentAuthority: "Auth3333333333333333333333333333333333333333",
    policy: {
      allowedTokens: [
        "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        "So11111111111111111111111111111111111111112",
      ],
      allowedProtocols: [
        "MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD",
        "KLend2g3cP87fffoy8q1mQqGKjrL1AyDX2KRKkRMFe5",
      ],
      dailyLimit: 300_000_000,  // $300
      maxTxSize: 50_000_000,    // $50
      strategyTag: "yield_farming",
    },
    dailySpent: 0,
    lastResetTimestamp: Math.floor(daysAgo(0) / 1000),
    totalTransactions: 44,
    realizedPnl: 67_120_000,    // +$67.12
    isPaused: true,
    index: 2,
    createdAt: daysAgo(7),
  },
];

function mockTx(
  subWalletId: string,
  daysBack: number,
  overrides: Partial<Transaction>
): Transaction {
  return {
    id: Math.random().toString(36).slice(2),
    subWalletId,
    tokenMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    tokenSymbol: "USDC",
    amount: 50_000_000,
    amountUsd: 50,
    direction: "buy",
    protocol: "Jupiter",
    pnl: null,
    timestamp: daysAgo(daysBack) + Math.random() * 86_400_000,
    txSignature: Math.random().toString(36).slice(2, 20),
    memo: "agent trade",
    status: "success",
    ...overrides,
  };
}

export const MOCK_TRANSACTIONS: Transaction[] = [
  mockTx("sw-1", 0, { amount: 75_000_000, amountUsd: 75, direction: "buy", tokenSymbol: "SOL", pnl: 4_200_000, memo: "buy SOL dip -2.3%" }),
  mockTx("sw-1", 0, { amount: 75_000_000, amountUsd: 75, direction: "sell", tokenSymbol: "SOL", pnl: 1_120_000, memo: "take profit +1.5%" }),
  mockTx("sw-1", 0, { amount: 100_000_000, amountUsd: 100, direction: "buy", tokenSymbol: "SOL", pnl: null, memo: "position open" }),
  mockTx("sw-1", 0, { amount: 200_000_000, amountUsd: 200, status: "blocked", blockedReason: "Exceeds max tx size ($100)", memo: "blocked by policy" }),
  mockTx("sw-1", 1, { amount: 85_000_000, amountUsd: 85, direction: "sell", tokenSymbol: "SOL", pnl: 2_800_000 }),
  mockTx("sw-1", 1, { amount: 60_000_000, amountUsd: 60, direction: "buy", tokenSymbol: "SOL", pnl: -1_200_000 }),
  mockTx("sw-1", 2, { amount: 90_000_000, amountUsd: 90, direction: "buy", tokenSymbol: "SOL", pnl: 5_100_000 }),
  mockTx("sw-2", 0, { amount: 180_000_000, amountUsd: 180, direction: "buy", tokenSymbol: "SOL", pnl: -8_400_000, protocol: "Raydium", memo: "arb SOL/USDT" }),
  mockTx("sw-2", 0, { amount: 150_000_000, amountUsd: 150, direction: "sell", tokenSymbol: "JUP", pnl: 3_200_000, memo: "arb JUP/USDC" }),
  mockTx("sw-2", 0, { amount: 250_000_000, amountUsd: 250, status: "blocked", blockedReason: "Token BONK not in whitelist", memo: "attempted BONK trade" }),
  mockTx("sw-2", 1, { amount: 200_000_000, amountUsd: 200, direction: "buy", tokenSymbol: "USDT", pnl: -5_800_000, protocol: "Orca" }),
  mockTx("sw-3", 3, { amount: 40_000_000, amountUsd: 40, direction: "buy", tokenSymbol: "SOL", pnl: 1_900_000, protocol: "Marinade", memo: "stake SOL" }),
  mockTx("sw-3", 5, { amount: 30_000_000, amountUsd: 30, direction: "buy", tokenSymbol: "USDC", pnl: 800_000, protocol: "Kamino", memo: "supply USDC" }),
];

export function getMockPerformance(subWalletId: string): AgentPerformance {
  const txs = MOCK_TRANSACTIONS.filter(
    (t) => t.subWalletId === subWalletId && t.status === "success"
  );
  const pnls = txs.map((t) => t.pnl ?? 0).filter(Boolean);
  const wins = pnls.filter((p) => p > 0).length;

  const dailyPnlHistory: { date: string; pnl: number; cumPnl: number }[] = [];
  let cum = 0;
  for (let i = 29; i >= 0; i--) {
    const d = new Date(daysAgo(i));
    const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const dailyPnl = Math.round((Math.random() - 0.42) * 20_000_000);
    cum += dailyPnl;
    dailyPnlHistory.push({ date: label, pnl: dailyPnl / 1e6, cumPnl: cum / 1e6 });
  }

  const wallet = MOCK_SUB_WALLETS.find((w) => w.id === subWalletId)!;
  return {
    subWalletId,
    totalVolume: txs.reduce((s, t) => s + t.amountUsd, 0),
    winRate: pnls.length ? (wins / pnls.length) * 100 : 0,
    totalPnl: wallet.realizedPnl / 1e6,
    avgTxSize: txs.length ? txs.reduce((s, t) => s + t.amountUsd, 0) / txs.length : 0,
    transactionCount: wallet.totalTransactions,
    bestTrade: pnls.length ? Math.max(...pnls) / 1e6 : 0,
    worstTrade: pnls.length ? Math.min(...pnls) / 1e6 : 0,
    dailyPnlHistory,
  };
}
