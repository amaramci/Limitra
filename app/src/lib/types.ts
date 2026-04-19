export type StrategyTag =
  | "spot_trading"
  | "arbitrage"
  | "yield_farming"
  | "dca"
  | "market_making"
  | "custom";

export interface PolicyConfig {
  allowedTokens: string[];      // mint addresses
  allowedProtocols: string[];   // program IDs
  dailyLimit: number;           // in USDC (6 decimals)
  maxTxSize: number;            // in USDC
  strategyTag: StrategyTag;
}

export interface SubWallet {
  id: string;
  address: string;
  name: string;
  agentDescription: string;
  agentAuthority: string;
  policy: PolicyConfig;
  dailySpent: number;
  lastResetTimestamp: number;
  totalTransactions: number;
  realizedPnl: number;           // in USDC cents
  isPaused: boolean;
  index: number;
  createdAt: number;
}

export interface Transaction {
  id: string;
  subWalletId: string;
  tokenMint: string;
  tokenSymbol: string;
  amount: number;
  amountUsd: number;
  direction: "buy" | "sell";
  protocol: string;
  pnl: number | null;
  timestamp: number;
  txSignature: string;
  memo: string;
  status: "success" | "blocked" | "pending";
  blockedReason?: string;
}

export interface AgentPerformance {
  subWalletId: string;
  totalVolume: number;
  winRate: number;
  totalPnl: number;
  avgTxSize: number;
  transactionCount: number;
  bestTrade: number;
  worstTrade: number;
  dailyPnlHistory: { date: string; pnl: number; cumPnl: number }[];
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  toolCalls?: ToolCallRecord[];
}

export interface ToolCallRecord {
  name: string;
  input: Record<string, unknown>;
  output: unknown;
  blocked: boolean;
  blockedReason?: string;
}

export type TokenInfo = {
  symbol: string;
  mint: string;
  decimals: number;
  logoUri?: string;
};

export const KNOWN_TOKENS: TokenInfo[] = [
  {
    symbol: "USDC",
    mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    decimals: 6,
  },
  {
    symbol: "SOL",
    mint: "So11111111111111111111111111111111111111112",
    decimals: 9,
  },
  {
    symbol: "USDT",
    mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    decimals: 6,
  },
  {
    symbol: "JUP",
    mint: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
    decimals: 6,
  },
  {
    symbol: "BONK",
    mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
    decimals: 5,
  },
  {
    symbol: "RAY",
    mint: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
    decimals: 6,
  },
];

export const KNOWN_PROTOCOLS = [
  { name: "Jupiter", programId: "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4" },
  { name: "Raydium", programId: "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8" },
  { name: "Orca", programId: "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc" },
  { name: "Marinade", programId: "MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD" },
  { name: "Kamino", programId: "KLend2g3cP87fffoy8q1mQqGKjrL1AyDX2KRKkRMFe5" },
];
