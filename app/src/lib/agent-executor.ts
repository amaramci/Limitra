import Anthropic from "@anthropic-ai/sdk";
import { Connection, PublicKey } from "@solana/web3.js";
import { fetchPricesBySymbol } from "./jupiter";
import { getQuote, executeSwap, usdToBaseUnits } from "./jupiter-swap";
import { loadAgentKeypair } from "./vault";
import { supabase } from "./supabase";
import { KNOWN_TOKENS, KNOWN_PROTOCOLS } from "./types";
import { getConnection } from "./solana";

const client = new Anthropic();

interface AgentContext {
  subWalletId: string;
  ownerPubkey: string;
  name: string;
}

interface OnChainPolicy {
  allowedTokens: string[];      // mints
  allowedProtocols: string[];
  dailyLimit: number;           // USDC base units
  maxTxSize: number;
  strategyTag: string;
  dailySpent: number;
  isPaused: boolean;
}

// ── Fetch on-chain policy via Anchor ─────────────────────────────────────────

async function fetchPolicy(subWalletId: string): Promise<OnChainPolicy | null> {
  try {
    const { AnchorProvider, Program } = await import("@coral-xyz/anchor");
    const idl = (await import("./idl.json")).default;
    const connection = getConnection();

    // Read-only provider (no wallet needed for reads)
    const provider = new AnchorProvider(
      connection,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { publicKey: PublicKey.default, signTransaction: async (t: any) => t, signAllTransactions: async (t: any) => t },
      { commitment: "confirmed" }
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const program = new Program(idl as any, provider);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const acc: any = await (program.account as any).subWallet.fetch(new PublicKey(subWalletId));

    return {
      allowedTokens: acc.policy.allowedTokens.map((pk: PublicKey) => pk.toBase58()),
      allowedProtocols: acc.policy.allowedProtocols.map((pk: PublicKey) => pk.toBase58()),
      dailyLimit: acc.policy.dailyLimit.toNumber(),
      maxTxSize: acc.policy.maxTxSize.toNumber(),
      strategyTag: acc.policy.strategyTag,
      dailySpent: acc.dailySpent.toNumber(),
      isPaused: acc.isPaused,
    };
  } catch {
    return null;
  }
}

// ── Claude decision ───────────────────────────────────────────────────────────

interface TradeDecision {
  action: "buy" | "sell" | "hold";
  fromToken?: string;
  toToken?: string;
  amountUsd?: number;
  reasoning: string;
}

async function getClaudeDecision(
  agent: AgentContext,
  policy: OnChainPolicy,
  prices: Record<string, number>,
  balances: Record<string, number>
): Promise<TradeDecision> {
  const allowedSymbols = policy.allowedTokens
    .map((m) => KNOWN_TOKENS.find((t) => t.mint === m)?.symbol)
    .filter(Boolean) as string[];

  const priceLines = allowedSymbols
    .map((s) => `${s}: $${prices[s]?.toFixed(4) ?? "N/A"}`)
    .join(", ");

  const balanceLines = allowedSymbols
    .map((s) => {
      const bal = balances[s] ?? 0;
      const usdVal = bal * (prices[s] ?? 0);
      return `${s}: ${bal.toFixed(s === "USDC" ? 2 : 4)} ($${usdVal.toFixed(2)})`;
    })
    .join(", ");

  const remainingDaily = (policy.dailyLimit - policy.dailySpent) / 1e6;
  const maxTx = policy.maxTxSize / 1e6;

  const hasSol = (balances["SOL"] ?? 0) > 0.1;
  const hasUsdc = (balances["USDC"] ?? 0) > 1;
  const rebalanceHint = hasSol && !hasUsdc
    ? `\nIMPORTANT: You hold SOL but no USDC. Sell some SOL for USDC now to establish a trading position. Use fromToken: "SOL", toToken: "USDC".`
    : hasUsdc && !hasSol
    ? `\nIMPORTANT: You hold USDC but no SOL. Buy SOL now. Use fromToken: "USDC", toToken: "SOL".`
    : "";

  const prompt = `You are an autonomous ${policy.strategyTag} trading agent named "${agent.name}" running on Solana devnet.

Current market prices: ${priceLines}
Agent wallet balances: ${balanceLines}
Strategy: ${policy.strategyTag}
Allowed tokens: ${allowedSymbols.join(", ")}
Daily limit remaining: $${remainingDaily.toFixed(2)}
Max transaction size: $${maxTx.toFixed(2)}
${rebalanceHint}
You MUST trade unless there is a strong reason not to. "hold" is only acceptable if daily limit is exhausted.
Respond with valid JSON only, no other text:
{
  "action": "buy" | "sell" | "hold",
  "fromToken": "SOL",
  "toToken": "USDC",
  "amountUsd": 50,
  "reasoning": "brief explanation"
}

For "hold", omit fromToken/toToken/amountUsd.
Keep amountUsd <= $${Math.min(maxTx, remainingDaily).toFixed(2)}.
Only use tokens from the allowed list.`;

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001", // haiku for fast/cheap cron decisions
    max_tokens: 256,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");
    return JSON.parse(jsonMatch[0]) as TradeDecision;
  } catch {
    return { action: "hold", reasoning: "Failed to parse Claude response" };
  }
}

// ── Policy validation ─────────────────────────────────────────────────────────

function validateDecision(
  decision: TradeDecision,
  policy: OnChainPolicy
): { allowed: boolean; reason?: string } {
  if (decision.action === "hold") return { allowed: true };
  if (!decision.fromToken || !decision.toToken || !decision.amountUsd) {
    return { allowed: false, reason: "Incomplete trade decision" };
  }

  const fromMint = KNOWN_TOKENS.find((t) => t.symbol === decision.fromToken)?.mint;
  const toMint = KNOWN_TOKENS.find((t) => t.symbol === decision.toToken)?.mint;

  if (!fromMint || !policy.allowedTokens.includes(fromMint)) {
    return { allowed: false, reason: `Token ${decision.fromToken} not in whitelist` };
  }
  if (!toMint || !policy.allowedTokens.includes(toMint)) {
    return { allowed: false, reason: `Token ${decision.toToken} not in whitelist` };
  }

  const amountBaseUnits = decision.amountUsd * 1e6;
  if (amountBaseUnits > policy.maxTxSize) {
    return { allowed: false, reason: `$${decision.amountUsd} exceeds max tx size $${policy.maxTxSize / 1e6}` };
  }
  if (policy.dailySpent + amountBaseUnits > policy.dailyLimit) {
    return { allowed: false, reason: `Would exceed daily limit ($${(policy.dailyLimit - policy.dailySpent) / 1e6} remaining)` };
  }

  return { allowed: true };
}

// ── Record transaction ────────────────────────────────────────────────────────

async function recordTx(
  subWalletId: string,
  decision: TradeDecision,
  status: "success" | "failed" | "blocked" | "hold",
  extra: { txSig?: string; inAmount?: bigint; outAmount?: bigint; blockedReason?: string } = {}
) {
  if (status === "hold") return;
  await supabase.from("agent_transactions").insert({
    sub_wallet_id: subWalletId,
    from_token: KNOWN_TOKENS.find((t) => t.symbol === decision.fromToken)?.mint ?? "",
    to_token: KNOWN_TOKENS.find((t) => t.symbol === decision.toToken)?.mint ?? "",
    from_symbol: decision.fromToken ?? "",
    to_symbol: decision.toToken ?? "",
    amount_in: extra.inAmount ? Number(extra.inAmount) : (decision.amountUsd ?? 0) * 1e6,
    amount_out: extra.outAmount ? Number(extra.outAmount) : null,
    amount_usd: decision.amountUsd ?? 0,
    tx_signature: extra.txSig ?? null,
    status,
    blocked_reason: extra.blockedReason ?? null,
    claude_reasoning: decision.reasoning,
  });
}

// ── Main: run one agent ───────────────────────────────────────────────────────

export async function runAgent(agent: AgentContext): Promise<{
  action: string;
  reasoning: string;
  txSig?: string;
  error?: string;
}> {
  try {
    // 1. Fetch on-chain policy
    const policy = await fetchPolicy(agent.subWalletId);
    if (!policy) return { action: "skip", reasoning: "Could not fetch on-chain policy" };
    if (policy.isPaused) return { action: "skip", reasoning: "Agent is paused" };

    // 2. Fetch real prices from CoinGecko
    const allowedSymbols = policy.allowedTokens
      .map((m) => KNOWN_TOKENS.find((t) => t.mint === m)?.symbol)
      .filter(Boolean) as string[];
    const prices = await fetchPricesBySymbol(allowedSymbols);

    // 2b. Fetch agent wallet token balances
    const agentBalances: Record<string, number> = {};
    try {
      const keypairForBalance = await loadAgentKeypair(agent.subWalletId);
      const connection = getConnection();
      const solBalance = await connection.getBalance(keypairForBalance.publicKey);
      agentBalances["SOL"] = solBalance / 1e9;

      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        keypairForBalance.publicKey,
        { programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA") }
      );
      for (const { account } of tokenAccounts.value) {
        const info = account.data.parsed?.info;
        const mint = info?.mint as string | undefined;
        const amount = info?.tokenAmount?.uiAmount as number | undefined;
        if (mint && amount !== undefined) {
          const sym = KNOWN_TOKENS.find((t) => t.mint === mint)?.symbol;
          if (sym) agentBalances[sym] = amount;
        }
      }
    } catch { /* balances stay empty */ }

    // 3. Claude decides what to do
    const decision = await getClaudeDecision(agent, policy, prices, agentBalances);
    if (decision.action === "hold") {
      return { action: "hold", reasoning: decision.reasoning };
    }

    // 4. Validate against policy (client-side pre-check before on-chain)
    const validation = validateDecision(decision, policy);
    if (!validation.allowed) {
      await recordTx(agent.subWalletId, decision, "blocked", { blockedReason: validation.reason });
      return { action: "blocked", reasoning: validation.reason ?? "Policy violation" };
    }

    // 5. Get Jupiter quote
    const amountBaseUnits = usdToBaseUnits(
      decision.amountUsd!,
      decision.fromToken!
    );
    const quote = await getQuote(decision.fromToken!, decision.toToken!, amountBaseUnits);

    // 6. Load agent keypair and execute swap
    const keypair = await loadAgentKeypair(agent.subWalletId);
    const result = await executeSwap(getConnection(), keypair, quote);

    // 7. Record success
    await recordTx(agent.subWalletId, decision, "success", {
      txSig: result.txSignature,
      inAmount: result.inAmount,
      outAmount: result.outAmount,
    });

    // 8. Update last_run_at
    await supabase
      .from("agents")
      .update({ last_run_at: new Date().toISOString() })
      .eq("id", agent.subWalletId);

    return {
      action: `${decision.action} ${decision.fromToken}→${decision.toToken}`,
      reasoning: decision.reasoning,
      txSig: result.txSignature,
    };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    return { action: "error", reasoning: error, error };
  }
}
