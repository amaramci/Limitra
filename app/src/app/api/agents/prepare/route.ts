import { NextResponse } from "next/server";
import { generateAgentKeypair, storeTempKeypair } from "@/lib/vault";

// Generate a server-side agent keypair before the user signs the Anchor tx
export async function POST() {
  try {
    const { keypair, tempId, agentPubkey } = generateAgentKeypair();
    await storeTempKeypair(tempId, keypair);
    return NextResponse.json({ tempId, agentPubkey });
  } catch (e) {
    console.error("prepare agent error:", e);
    return NextResponse.json({ error: "Failed to generate keypair" }, { status: 500 });
  }
}
