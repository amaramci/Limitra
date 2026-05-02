import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { Keypair } from "@solana/web3.js";
import { supabase } from "./supabase";

const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) throw new Error("ENCRYPTION_KEY must be 64 hex chars (32 bytes)");
  return Buffer.from(hex, "hex");
}

function encrypt(data: string): { encrypted: string; iv: string; authTag: string } {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(data, "utf8"), cipher.final()]);
  return {
    encrypted: encrypted.toString("hex"),
    iv: iv.toString("hex"),
    authTag: cipher.getAuthTag().toString("hex"),
  };
}

function decrypt(encrypted: string, iv: string, authTag: string): string {
  const decipher = createDecipheriv(ALGORITHM, getKey(), Buffer.from(iv, "hex"));
  decipher.setAuthTag(Buffer.from(authTag, "hex"));
  return Buffer.concat([
    decipher.update(Buffer.from(encrypted, "hex")),
    decipher.final(),
  ]).toString("utf8");
}

// ── Public API ────────────────────────────────────────────────────────────────

export function generateAgentKeypair(): {
  keypair: Keypair;
  tempId: string;
  agentPubkey: string;
} {
  const keypair = Keypair.generate();
  const tempId = randomBytes(16).toString("hex");
  return { keypair, tempId, agentPubkey: keypair.publicKey.toBase58() };
}

export async function storeTempKeypair(
  tempId: string,
  keypair: Keypair
): Promise<void> {
  const privkeyHex = Buffer.from(keypair.secretKey).toString("hex");
  const { encrypted, iv, authTag } = encrypt(privkeyHex);
  await supabase.from("temp_keypairs").insert({
    temp_id: tempId,
    agent_pubkey: keypair.publicKey.toBase58(),
    encrypted_privkey: encrypted,
    iv,
    auth_tag: authTag,
  });
}

export async function finalizeAgentKeypair(
  tempId: string,
  subWalletId: string,
  ownerPubkey: string,
  name: string
): Promise<void> {
  const { data, error } = await supabase
    .from("temp_keypairs")
    .select("*")
    .eq("temp_id", tempId)
    .single();

  if (error || !data) throw new Error("Temp keypair not found");

  await supabase.from("agents").insert({
    id: subWalletId,
    owner_pubkey: ownerPubkey,
    agent_pubkey: data.agent_pubkey,
    encrypted_privkey: data.encrypted_privkey,
    iv: data.iv,
    auth_tag: data.auth_tag,
    name,
    is_active: true,
  });

  await supabase.from("temp_keypairs").delete().eq("temp_id", tempId);
}

export async function loadAgentKeypair(subWalletId: string): Promise<Keypair> {
  const { data, error } = await supabase
    .from("agents")
    .select("encrypted_privkey, iv, auth_tag")
    .eq("id", subWalletId)
    .single();

  if (error || !data) throw new Error(`Agent keypair not found: ${subWalletId}`);

  const privkeyHex = decrypt(data.encrypted_privkey, data.iv, data.auth_tag);
  return Keypair.fromSecretKey(Buffer.from(privkeyHex, "hex"));
}

export async function getActiveAgents() {
  const { data } = await supabase
    .from("agents")
    .select("id, owner_pubkey, agent_pubkey, name")
    .eq("is_active", true);
  return data ?? [];
}
