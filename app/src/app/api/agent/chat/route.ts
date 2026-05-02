import { NextRequest, NextResponse } from "next/server";
import { runAgentChat } from "@/lib/claude-agent";
import { ChatMessage, SubWallet, Transaction } from "@/lib/types";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { wallet, transactions, messages } = body as {
      wallet: SubWallet;
      transactions: Transaction[];
      messages: ChatMessage[];
    };

    if (!wallet) {
      return NextResponse.json({ error: "wallet is required" }, { status: 400 });
    }

    const anthropicMessages: Anthropic.MessageParam[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const { text, toolCalls } = await runAgentChat(
      anthropicMessages,
      wallet,
      transactions
    );

    return NextResponse.json({ text, toolCalls });
  } catch (error) {
    console.error("Agent chat error:", error);
    return NextResponse.json({ error: "Failed to process agent request" }, { status: 500 });
  }
}
