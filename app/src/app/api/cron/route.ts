import { NextRequest, NextResponse } from "next/server";
import { getActiveAgents } from "@/lib/vault";
import { runAgent } from "@/lib/agent-executor";

// Vercel cron calls this endpoint on schedule (see vercel.json)
// Also callable manually: POST /api/cron with { secret: CRON_SECRET }
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // Verify it's Vercel cron or manual call with secret
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const agents = await getActiveAgents();
  if (agents.length === 0) {
    return NextResponse.json({ message: "No active agents", ran: 0 });
  }

  // Run all agents in parallel
  const results = await Promise.allSettled(
    agents.map((agent) =>
      runAgent({
        subWalletId: agent.id,
        ownerPubkey: agent.owner_pubkey,
        name: agent.name,
      })
    )
  );

  const summary = results.map((r, i) => ({
    agent: agents[i].id.slice(0, 8),
    name: agents[i].name,
    result: r.status === "fulfilled" ? r.value : { action: "error", reasoning: String(r.reason) },
  }));

  console.log("Cron run:", JSON.stringify(summary, null, 2));
  return NextResponse.json({ ran: agents.length, summary });
}

// Vercel cron uses GET
export async function GET(req: NextRequest) {
  return POST(req);
}
