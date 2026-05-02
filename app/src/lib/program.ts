import { AnchorProvider, Program, BN, web3 } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { AnchorWallet } from "@solana/wallet-adapter-react";
import { getConnection } from "./solana";
import idl from "./idl.json";
import { SubWallet, PolicyConfig, KNOWN_TOKENS } from "./types";

const PROGRAM_ID = new PublicKey("9qQcnqLMemRQZJTFBkgULoAK6AwGVPdDcS9chXZmDTpM");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SAWProgram = Program<any>; // typed as any to avoid IDL type gymnastics

export function getProgram(wallet: AnchorWallet): SAWProgram {
  const connection = getConnection();
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new Program(idl as any, provider) as SAWProgram;
}

// ── PDAs ─────────────────────────────────────────────────────────────────────

export function deriveMainWalletPDA(owner: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("main_wallet"), owner.toBuffer()],
    PROGRAM_ID
  );
}

export function deriveSubWalletPDA(
  mainWallet: PublicKey,
  index: number
): [PublicKey, number] {
  const indexBuf = Buffer.alloc(8);
  indexBuf.writeBigUInt64LE(BigInt(index));
  return PublicKey.findProgramAddressSync(
    [Buffer.from("sub_wallet"), mainWallet.toBuffer(), indexBuf],
    PROGRAM_ID
  );
}

// ── Read ──────────────────────────────────────────────────────────────────────

export async function fetchMainWallet(
  program: SAWProgram,
  owner: PublicKey
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any | null> {
  const [pda] = deriveMainWalletPDA(owner);
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await (program.account as any).mainWallet.fetch(pda);
  } catch {
    return null;
  }
}

export async function fetchAllSubWallets(
  program: SAWProgram,
  owner: PublicKey
): Promise<SubWallet[]> {
  const [mainWalletPDA] = deriveMainWalletPDA(owner);
  const mainWallet = await fetchMainWallet(program, owner);
  if (!mainWallet) return [];

  const count: number = mainWallet.subWalletCount.toNumber();
  const results: SubWallet[] = [];

  for (let i = 0; i < count; i++) {
    const [subPDA] = deriveSubWalletPDA(mainWalletPDA, i);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const acc: any = await (program.account as any).subWallet.fetch(subPDA);
      results.push(deserializeSubWallet(acc, subPDA, i));
    } catch {
      // account might not exist if something went wrong during creation
    }
  }

  return results;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function deserializeSubWallet(acc: any, pda: PublicKey, index: number): SubWallet {
  const policy: PolicyConfig = {
    allowedTokens: acc.policy.allowedTokens.map((pk: PublicKey) => pk.toBase58()),
    allowedProtocols: acc.policy.allowedProtocols.map((pk: PublicKey) => pk.toBase58()),
    dailyLimit: acc.policy.dailyLimit.toNumber(),
    maxTxSize: acc.policy.maxTxSize.toNumber(),
    strategyTag: acc.policy.strategyTag,
  };

  return {
    id: pda.toBase58(),
    address: pda.toBase58(),
    name: acc.name,
    agentDescription: acc.agentDescription,
    agentAuthority: acc.agentAuthority.toBase58(),
    policy,
    dailySpent: acc.dailySpent.toNumber(),
    lastResetTimestamp: acc.lastResetTimestamp.toNumber(),
    totalTransactions: acc.totalTransactions.toNumber(),
    realizedPnl: acc.realizedPnl.toNumber(),
    isPaused: acc.isPaused,
    index,
    createdAt: Date.now(),
  };
}

// ── Write ─────────────────────────────────────────────────────────────────────

export async function initializeMainWallet(
  program: SAWProgram,
  owner: PublicKey
): Promise<string> {
  const [mainWalletPDA] = deriveMainWalletPDA(owner);
  const tx = await program.methods
    .initializeMainWallet()
    .accountsPartial({
      mainWallet: mainWalletPDA,
      owner,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
  return tx;
}

export async function createSubWallet(
  program: SAWProgram,
  owner: PublicKey,
  name: string,
  agentDescription: string,
  policy: PolicyConfig,
  agentAuthority: PublicKey
): Promise<{ tx: string; subWalletPDA: PublicKey }> {
  const [mainWalletPDA] = deriveMainWalletPDA(owner);

  // initialize main wallet if it doesn't exist yet
  const existing = await fetchMainWallet(program, owner);
  if (!existing) {
    await initializeMainWallet(program, owner);
  }

  const mainWallet = await fetchMainWallet(program, owner);
  const index: number = mainWallet.subWalletCount.toNumber();
  const [subWalletPDA] = deriveSubWalletPDA(mainWalletPDA, index);

  const onChainPolicy = {
    allowedTokens: policy.allowedTokens.map((m) => new PublicKey(m)),
    allowedProtocols: policy.allowedProtocols.map((p) => new PublicKey(p)),
    dailyLimit: new BN(policy.dailyLimit),
    maxTxSize: new BN(policy.maxTxSize),
    strategyTag: policy.strategyTag,
  };

  const tx = await program.methods
    .createSubWallet(name, agentDescription, onChainPolicy)
    .accountsPartial({
      mainWallet: mainWalletPDA,
      subWallet: subWalletPDA,
      agentAuthority,
      owner,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  return { tx, subWalletPDA };
}

export async function updatePolicy(
  program: SAWProgram,
  owner: PublicKey,
  subWalletPDA: PublicKey,
  policy: PolicyConfig
): Promise<string> {
  const [mainWalletPDA] = deriveMainWalletPDA(owner);

  const onChainPolicy = {
    allowedTokens: policy.allowedTokens.map((m) => new PublicKey(m)),
    allowedProtocols: policy.allowedProtocols.map((p) => new PublicKey(p)),
    dailyLimit: new BN(policy.dailyLimit),
    maxTxSize: new BN(policy.maxTxSize),
    strategyTag: policy.strategyTag,
  };

  return program.methods
    .updatePolicy(onChainPolicy)
    .accountsPartial({
      mainWallet: mainWalletPDA,
      subWallet: subWalletPDA,
      owner,
    })
    .rpc();
}

export async function pauseSubWallet(
  program: SAWProgram,
  owner: PublicKey,
  subWalletPDA: PublicKey,
  paused: boolean
): Promise<string> {
  const [mainWalletPDA] = deriveMainWalletPDA(owner);
  return program.methods
    .pauseSubWallet(paused)
    .accountsPartial({
      mainWallet: mainWalletPDA,
      subWallet: subWalletPDA,
      owner,
    })
    .rpc();
}

// ── Explorer links ────────────────────────────────────────────────────────────

export function explorerTx(sig: string) {
  return `https://solscan.io/tx/${sig}?cluster=devnet`;
}

export function explorerAccount(address: string) {
  return `https://solscan.io/account/${address}?cluster=devnet`;
}

// Helper: mint → symbol
export function mintToSymbol(mint: string): string {
  return KNOWN_TOKENS.find((t) => t.mint === mint)?.symbol ?? mint.slice(0, 6);
}
