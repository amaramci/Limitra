import { NextRequest, NextResponse } from "next/server";
import { runAgentChat } from "@/lib/claude-agent";
import { MOCK_SUB_WALLETS, MOCK_TRANSACTIONS } from "@/lib/mock-data";
import { ChatMessage } from "@/lib/types";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { walletId, messages } = body as {
      walletId: string;
      messages: ChatMessage[];
    };

    const wallet = MOCK_SUB_WALLETS.find((w) => w.id === walletId);
    if (!wallet) {
      return NextResponse.json({ error: "Sub-wallet not found" }, { status: 404 });
    }

    // Convert our ChatMessage format to Anthropic format
    const anthropicMessages: Anthropic.MessageParam[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const { text, toolCalls } = await runAgentChat(
      anthropicMessages,
      wallet,
      MOCK_TRANSACTIONS
    );

    return NextResponse.json({ text, toolCalls });
  } catch (error) {
    console.error("Agent chat error:", error);
    return NextResponse.json(
      { error: "Failed to process agent request" },
      { status: 500 }
    );
  }
}
