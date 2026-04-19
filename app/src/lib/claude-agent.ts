import Anthropic from "@anthropic-ai/sdk";
import { SubWallet, Transaction, KNOWN_TOKENS, KNOWN_PROTOCOLS } from "./types";

const client = new Anthropic();

// ── Tool definitions — each tool is pre-filtered by the sub-wallet's policy ──

function buildTools(wallet: SubWallet): Anthropic.Tool[] {
  const allowedTokenSymbols = wallet.policy.allowedTokens
    .map((mint) => KNOWN_TOKENS.find((t) => t.mint === mint)?.symbol ?? mint.slice(0, 8))
    .join(", ");

  const allowedProtocolNames = wallet.policy.allowedProtocols
    .map((pid) => KNOWN_PROTOCOLS.find((p) => p.programId === pid)?.name ?? pid.slice(0, 8))
    .join(", ");

  return [
    {
      name: "get_policy",
      description: "Get the current spending policy for this sub-wallet.",
      input_schema: {
        type: "object" as const,
        properties: {},
        required: [],
      },
    },
    {
      name: "check_daily_limit",
      description:
        "Check how much of the daily spending limit has been used and how much remains.",
      input_schema: {
        type: "object" as const,
        properties: {},
        required: [],
      },
    },
    {
      name: "get_token_price",
      description:
        `Get the current USD price of a token. ONLY tokens in the allowed list can be queried: ${allowedTokenSymbols}. Attempting other tokens will be blocked.`,
      input_schema: {
        type: "object" as const,
        properties: {
          symbol: {
            type: "string",
            description: `Token symbol. Allowed: ${allowedTokenSymbols}`,
          },
        },
        required: ["symbol"],
      },
    },
    {
      name: "execute_swap",
      description:
        `Execute a token swap. POLICY CONSTRAINTS: allowed tokens: ${allowedTokenSymbols}. Allowed protocols: ${allowedProtocolNames}. Max single tx: $${wallet.policy.maxTxSize / 1e6}. Daily limit: $${wallet.policy.dailyLimit / 1e6}. Any violation will be BLOCKED on-chain.`,
      input_schema: {
        type: "object" as const,
        properties: {
          fromToken: { type: "string", description: "Source token symbol" },
          toToken: { type: "string", description: "Destination token symbol" },
          amountUsd: { type: "number", description: "Amount in USD to swap" },
          protocol: { type: "string", description: `DEX to use. Allowed: ${allowedProtocolNames}` },
          reasoning: { type: "string", description: "Why you're making this trade" },
        },
        required: ["fromToken", "toToken", "amountUsd", "protocol", "reasoning"],
      },
    },
    {
      name: "get_portfolio",
      description: "Get the current token balances held by this sub-wallet.",
      input_schema: {
        type: "object" as const,
        properties: {},
        required: [],
      },
    },
    {
      name: "get_transaction_history",
      description: "Get recent transactions executed by this agent.",
      input_schema: {
        type: "object" as const,
        properties: {
          limit: { type: "number", description: "Number of transactions to return (max 20)" },
        },
        required: [],
      },
    },
    {
      name: "analyze_performance",
      description:
        "Analyze the performance of this strategy: P&L, win rate, avg trade size, and suggestions for optimizing parameters.",
      input_schema: {
        type: "object" as const,
        properties: {
          period: {
            type: "string",
            enum: ["24h", "7d", "30d"],
            description: "Time period to analyze",
          },
        },
        required: ["period"],
      },
    },
    {
      name: "suggest_policy_changes",
      description:
        "Based on performance data, suggest adjustments to the sub-wallet policy (limits, allowed tokens, etc.) that the main wallet owner should consider.",
      input_schema: {
        type: "object" as const,
        properties: {},
        required: [],
      },
    },
  ];
}

// ── Tool executor — validates policy before simulating execution ───────────

export function executeAgentTool(
  toolName: string,
  toolInput: Record<string, unknown>,
  wallet: SubWallet,
  transactions: Transaction[]
): { result: unknown; blocked: boolean; blockedReason?: string } {
  switch (toolName) {
    case "get_policy": {
      const allowed = wallet.policy.allowedTokens.map(
        (mint) => KNOWN_TOKENS.find((t) => t.mint === mint)?.symbol ?? mint.slice(0, 8)
      );
      const protocols = wallet.policy.allowedProtocols.map(
        (pid) => KNOWN_PROTOCOLS.find((p) => p.programId === pid)?.name ?? pid.slice(0, 8)
      );
      return {
        blocked: false,
        result: {
          allowedTokens: allowed,
          allowedProtocols: protocols,
          dailyLimit: `$${(wallet.policy.dailyLimit / 1e6).toFixed(2)}`,
          maxTxSize: `$${(wallet.policy.maxTxSize / 1e6).toFixed(2)}`,
          strategyTag: wallet.policy.strategyTag,
          isPaused: wallet.isPaused,
        },
      };
    }

    case "check_daily_limit": {
      const remaining = wallet.policy.dailyLimit - wallet.dailySpent;
      const pct = ((wallet.dailySpent / wallet.policy.dailyLimit) * 100).toFixed(1);
      return {
        blocked: false,
        result: {
          dailyLimit: `$${(wallet.policy.dailyLimit / 1e6).toFixed(2)}`,
          spent: `$${(wallet.dailySpent / 1e6).toFixed(2)}`,
          remaining: `$${(remaining / 1e6).toFixed(2)}`,
          usedPercent: `${pct}%`,
          resetIn: "~" + Math.round((86400 - (Date.now() / 1000 - wallet.lastResetTimestamp)) / 3600) + "h",
        },
      };
    }

    case "get_token_price": {
      const symbol = toolInput.symbol as string;
      const allowedSymbols = wallet.policy.allowedTokens.map(
        (mint) => KNOWN_TOKENS.find((t) => t.mint === mint)?.symbol
      );
      if (!allowedSymbols.includes(symbol)) {
        return {
          blocked: true,
          blockedReason: `Token ${symbol} is not in the allowed list for this sub-wallet. Policy only permits: ${allowedSymbols.join(", ")}`,
          result: null,
        };
      }
      // Simulated prices
      const prices: Record<string, number> = {
        SOL: 142.37 + (Math.random() - 0.5) * 2,
        USDC: 1.0,
        USDT: 0.9998,
        JUP: 0.71 + (Math.random() - 0.5) * 0.05,
        BONK: 0.000018,
        RAY: 1.82,
      };
      return {
        blocked: false,
        result: {
          symbol,
          priceUsd: prices[symbol]?.toFixed(symbol === "BONK" ? 8 : 4) ?? "N/A",
          change24h: `${(Math.random() * 6 - 3).toFixed(2)}%`,
          source: "Jupiter Price API (simulated for demo)",
        },
      };
    }

    case "execute_swap": {
      const { fromToken, toToken, amountUsd, protocol, reasoning } = toolInput as {
        fromToken: string;
        toToken: string;
        amountUsd: number;
        protocol: string;
        reasoning: string;
      };

      if (wallet.isPaused) {
        return { blocked: true, blockedReason: "Sub-wallet is paused by the owner.", result: null };
      }

      const allowedSymbols = wallet.policy.allowedTokens.map(
        (mint) => KNOWN_TOKENS.find((t) => t.mint === mint)?.symbol
      );
      if (!allowedSymbols.includes(fromToken)) {
        return { blocked: true, blockedReason: `Token ${fromToken} is not in the whitelist.`, result: null };
      }
      if (!allowedSymbols.includes(toToken)) {
        return { blocked: true, blockedReason: `Token ${toToken} is not in the whitelist.`, result: null };
      }

      const allowedProtocolNames = wallet.policy.allowedProtocols.map(
        (pid) => KNOWN_PROTOCOLS.find((p) => p.programId === pid)?.name
      );
      if (!allowedProtocolNames.includes(protocol)) {
        return {
          blocked: true,
          blockedReason: `Protocol "${protocol}" is not in the allowed list. Permitted: ${allowedProtocolNames.join(", ")}`,
          result: null,
        };
      }

      const amountBaseUnits = amountUsd * 1e6;
      if (amountBaseUnits > wallet.policy.maxTxSize) {
        return {
          blocked: true,
          blockedReason: `Transaction size $${amountUsd} exceeds the max tx limit of $${(wallet.policy.maxTxSize / 1e6).toFixed(2)} set in policy.`,
          result: null,
        };
      }

      const newDailySpent = wallet.dailySpent + amountBaseUnits;
      if (newDailySpent > wallet.policy.dailyLimit) {
        const remaining = (wallet.policy.dailyLimit - wallet.dailySpent) / 1e6;
        return {
          blocked: true,
          blockedReason: `Would exceed daily limit. Only $${remaining.toFixed(2)} remaining today.`,
          result: null,
        };
      }

      // Simulated successful execution
      const slippage = (Math.random() * 0.3).toFixed(3);
      const txSig = Math.random().toString(36).slice(2, 20).toUpperCase();
      return {
        blocked: false,
        result: {
          status: "executed",
          txSignature: txSig,
          fromToken,
          toToken,
          amountUsd: amountUsd.toFixed(2),
          protocol,
          slippagePct: `${slippage}%`,
          reasoning,
          note: "Transaction validated against sub-wallet policy and executed on devnet (simulated).",
          explorerUrl: `https://solscan.io/tx/${txSig}?cluster=devnet`,
        },
      };
    }

    case "get_portfolio": {
      return {
        blocked: false,
        result: {
          balances: [
            { token: "USDC", amount: "342.18", valueUsd: "342.18" },
            { token: "SOL", amount: "1.847", valueUsd: "263.06" },
          ],
          totalValueUsd: "605.24",
          note: "Simulated balances for demo",
        },
      };
    }

    case "get_transaction_history": {
      const limit = Math.min((toolInput.limit as number) ?? 5, 20);
      const relevant = transactions
        .filter((t) => t.subWalletId === wallet.id)
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit)
        .map((t) => ({
          time: new Date(t.timestamp).toLocaleString(),
          direction: t.direction,
          token: t.tokenSymbol,
          amountUsd: `$${t.amountUsd}`,
          protocol: t.protocol,
          status: t.status,
          blockedReason: t.blockedReason,
          pnl: t.pnl != null ? `$${(t.pnl / 1e6).toFixed(2)}` : null,
          memo: t.memo,
        }));
      return { blocked: false, result: { transactions: relevant, total: wallet.totalTransactions } };
    }

    case "analyze_performance": {
      const period = toolInput.period as string;
      const pnl = wallet.realizedPnl / 1e6;
      const pnlStr = pnl >= 0 ? `+$${pnl.toFixed(2)}` : `-$${Math.abs(pnl).toFixed(2)}`;
      const winRate = pnl > 0 ? "61.4%" : "38.2%";
      const issues = [];
      const suggestions = [];

      if (wallet.dailySpent / wallet.policy.dailyLimit > 0.8) {
        issues.push("Daily limit nearly exhausted — consider increasing limit or reducing position sizes");
      }
      if (pnl < 0) {
        issues.push("Net negative P&L — strategy parameters may need tuning");
        suggestions.push(`Reduce max tx size from $${(wallet.policy.maxTxSize / 1e6).toFixed(0)} to $${(wallet.policy.maxTxSize / 1e6 * 0.5).toFixed(0)} to limit downside per trade`);
        suggestions.push("Consider adding stop-loss logic or tighter entry conditions");
      }
      if (wallet.policy.allowedProtocols.length === 1) {
        suggestions.push("Allowing 2+ protocols gives the agent more execution routes and potentially better prices");
      }
      if (pnl > 50) {
        suggestions.push(`Strong performance. Consider increasing daily limit from $${(wallet.policy.dailyLimit / 1e6).toFixed(0)} to $${(wallet.policy.dailyLimit / 1e6 * 1.5).toFixed(0)} to scale`);
      }

      return {
        blocked: false,
        result: {
          period,
          realizedPnl: pnlStr,
          winRate,
          totalTransactions: wallet.totalTransactions,
          avgTxSize: "$" + (wallet.policy.maxTxSize / 1e6 * 0.7).toFixed(2),
          issues: issues.length ? issues : ["No major issues detected"],
          suggestions: suggestions.length ? suggestions : ["Strategy appears well-configured"],
          strategyTag: wallet.policy.strategyTag,
        },
      };
    }

    case "suggest_policy_changes": {
      const pnl = wallet.realizedPnl / 1e6;
      const changes = [];

      if (pnl < -10) {
        changes.push({
          field: "maxTxSize",
          current: `$${(wallet.policy.maxTxSize / 1e6).toFixed(2)}`,
          suggested: `$${(wallet.policy.maxTxSize / 1e6 * 0.5).toFixed(2)}`,
          reason: "Reduce per-trade exposure since the strategy is losing money",
        });
        changes.push({
          field: "dailyLimit",
          current: `$${(wallet.policy.dailyLimit / 1e6).toFixed(2)}`,
          suggested: `$${(wallet.policy.dailyLimit / 1e6 * 0.6).toFixed(2)}`,
          reason: "Tighten daily budget until strategy is tuned",
        });
      } else if (pnl > 100) {
        changes.push({
          field: "dailyLimit",
          current: `$${(wallet.policy.dailyLimit / 1e6).toFixed(2)}`,
          suggested: `$${(wallet.policy.dailyLimit / 1e6 * 1.5).toFixed(2)}`,
          reason: "Scale up budget to capture more opportunity from a proven strategy",
        });
      }

      if (wallet.isPaused) {
        changes.push({
          field: "isPaused",
          current: "true",
          suggested: "false",
          reason: "Consider resuming — pausing limits potential gains",
        });
      }

      return {
        blocked: false,
        result: {
          suggestions: changes.length ? changes : [{ field: "none", current: "—", suggested: "—", reason: "Current policy looks well-tuned for this strategy" }],
          disclaimer: "These are automated suggestions. You as the main wallet owner have final control over all policy changes.",
        },
      };
    }

    default:
      return { blocked: false, result: { error: "Unknown tool" } };
  }
}

// ── Main agent chat function ──────────────────────────────────────────────────

export async function runAgentChat(
  messages: Anthropic.MessageParam[],
  wallet: SubWallet,
  transactions: Transaction[]
): Promise<{
  text: string;
  toolCalls: { name: string; input: Record<string, unknown>; output: unknown; blocked: boolean; blockedReason?: string }[];
}> {
  const systemPrompt = `You are an AI trading agent running inside a Smart Allowance Wallet sub-wallet named "${wallet.name}".

Your strategy: ${wallet.agentDescription}

You operate under strict policy constraints enforced ON-CHAIN by the smart contract. You CANNOT bypass them — any attempt will be blocked by the Solana program before execution:
- Allowed tokens: ${wallet.policy.allowedTokens.map((m) => KNOWN_TOKENS.find((t) => t.mint === m)?.symbol ?? m.slice(0, 8)).join(", ")}
- Allowed protocols: ${wallet.policy.allowedProtocols.map((p) => KNOWN_PROTOCOLS.find((k) => k.programId === p)?.name ?? p.slice(0, 8)).join(", ")}
- Daily spending limit: $${(wallet.policy.dailyLimit / 1e6).toFixed(2)}
- Max transaction size: $${(wallet.policy.maxTxSize / 1e6).toFixed(2)}
- Status: ${wallet.isPaused ? "PAUSED (cannot execute trades)" : "Active"}

When the user asks what you can do, explain your strategy and constraints. When asked to trade, use your tools and explain your reasoning. If a trade is blocked, clearly explain why — it's the smart contract enforcing the policy, not you refusing. You are transparent about your limitations.

Realized P&L so far: ${wallet.realizedPnl >= 0 ? "+" : ""}$${(wallet.realizedPnl / 1e6).toFixed(2)}
Total transactions: ${wallet.totalTransactions}

Be direct, data-driven, and honest about both wins and losses. When you see issues, call analyze_performance or suggest_policy_changes.`;

  const tools = buildTools(wallet);
  const toolCallRecords: { name: string; input: Record<string, unknown>; output: unknown; blocked: boolean; blockedReason?: string }[] = [];

  let currentMessages = [...messages];

  // Agentic loop — Claude can call multiple tools
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: systemPrompt,
      tools,
      messages: currentMessages,
    });

    if (response.stop_reason === "end_turn") {
      const text = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n");
      return { text, toolCalls: toolCallRecords };
    }

    if (response.stop_reason === "tool_use") {
      const toolUseBlocks = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
      );

      // Add assistant message with tool use
      currentMessages.push({ role: "assistant", content: response.content });

      // Execute all tool calls and collect results
      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const toolUse of toolUseBlocks) {
        const { result, blocked, blockedReason } = executeAgentTool(
          toolUse.name,
          toolUse.input as Record<string, unknown>,
          wallet,
          transactions
        );

        toolCallRecords.push({
          name: toolUse.name,
          input: toolUse.input as Record<string, unknown>,
          output: result,
          blocked,
          blockedReason,
        });

        const content = blocked
          ? `POLICY VIOLATION — Transaction blocked by smart contract: ${blockedReason}`
          : JSON.stringify(result, null, 2);

        toolResults.push({
          type: "tool_result",
          tool_use_id: toolUse.id,
          content,
        });
      }

      currentMessages.push({ role: "user", content: toolResults });
      continue;
    }

    // Unexpected stop reason
    break;
  }

  return { text: "Agent stopped unexpectedly.", toolCalls: toolCallRecords };
}
