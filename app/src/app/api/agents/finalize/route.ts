import { NextRequest, NextResponse } from "next/server";
import { finalizeAgentKeypair } from "@/lib/vault";

// Called after the Anchor tx confirms — links keypair to the on-chain PDA
export async function POST(req: NextRequest) {
  try {
    const { tempId, subWalletId, ownerPubkey, name } = await req.json();
    if (!tempId || !subWalletId || !ownerPubkey || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    await finalizeAgentKeypair(tempId, subWalletId, ownerPubkey, name);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("finalize agent error:", e);
    return NextResponse.json({ error: "Failed to finalize keypair" }, { status: 500 });
  }
}
