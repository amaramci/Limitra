import { SubWallet, PolicyConfig, Transaction } from "./types";

const WALLETS_KEY = (owner: string) => `saw:wallets:${owner}`;
const TXS_KEY = (subWalletId: string) => `saw:txs:${subWalletId}`;

export function loadSubWallets(ownerPubkey: string): SubWallet[] {
  try {
    const raw = localStorage.getItem(WALLETS_KEY(ownerPubkey));
    return raw ? (JSON.parse(raw) as SubWallet[]) : [];
  } catch {
    return [];
  }
}

export function saveSubWallet(ownerPubkey: string, wallet: SubWallet): void {
  const all = loadSubWallets(ownerPubkey);
  const idx = all.findIndex((w) => w.id === wallet.id);
  if (idx >= 0) all[idx] = wallet;
  else all.push(wallet);
  localStorage.setItem(WALLETS_KEY(ownerPubkey), JSON.stringify(all));
}

export function deleteSubWallet(ownerPubkey: string, id: string): void {
  const all = loadSubWallets(ownerPubkey).filter((w) => w.id !== id);
  localStorage.setItem(WALLETS_KEY(ownerPubkey), JSON.stringify(all));
}

export function createSubWallet(
  ownerPubkey: string,
  name: string,
  description: string,
  policy: PolicyConfig
): SubWallet {
  const all = loadSubWallets(ownerPubkey);
  const wallet: SubWallet = {
    id: `sw-${Date.now()}`,
    address: `${ownerPubkey.slice(0, 8)}...${Date.now().toString(36)}`,
    name,
    agentDescription: description,
    agentAuthority: ownerPubkey,
    policy,
    dailySpent: 0,
    lastResetTimestamp: Math.floor(Date.now() / 1000),
    totalTransactions: 0,
    realizedPnl: 0,
    isPaused: false,
    index: all.length,
    createdAt: Date.now(),
  };
  saveSubWallet(ownerPubkey, wallet);
  return wallet;
}

export function loadTransactions(subWalletId: string): Transaction[] {
  try {
    const raw = localStorage.getItem(TXS_KEY(subWalletId));
    return raw ? (JSON.parse(raw) as Transaction[]) : [];
  } catch {
    return [];
  }
}

export function saveTransaction(tx: Transaction): void {
  const all = loadTransactions(tx.subWalletId);
  all.unshift(tx);
  localStorage.setItem(TXS_KEY(tx.subWalletId), JSON.stringify(all.slice(0, 100)));
}
