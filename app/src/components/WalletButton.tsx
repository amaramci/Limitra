"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Wallet, LogOut, ChevronDown } from "lucide-react";
import { useState } from "react";

function truncate(pk: string) {
  return `${pk.slice(0, 4)}...${pk.slice(-4)}`;
}

export function WalletButton() {
  const { publicKey, disconnect, connecting } = useWallet();
  const { setVisible } = useWalletModal();
  const [open, setOpen] = useState(false);

  if (connecting) {
    return (
      <button className="flex items-center gap-2 px-3 py-1.5 bg-surface-700 border border-surface-500 text-gray-400 rounded-xl text-sm">
        Connecting…
      </button>
    );
  }

  if (!publicKey) {
    return (
      <button
        onClick={() => setVisible(true)}
        className="flex items-center gap-2 px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-medium transition-colors"
      >
        <Wallet size={13} />
        Connect wallet
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-1.5 bg-surface-700 hover:bg-surface-600 border border-surface-500 text-gray-200 rounded-xl text-sm transition-colors font-mono"
      >
        <div className="w-2 h-2 rounded-full bg-profit flex-shrink-0" />
        {truncate(publicKey.toBase58())}
        <ChevronDown size={12} className="text-gray-500" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 bg-surface-800 border border-surface-600 rounded-xl shadow-xl p-1 w-48">
            <button
              onClick={() => { disconnect(); setOpen(false); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-surface-700 rounded-lg transition-colors"
            >
              <LogOut size={13} />
              Disconnect
            </button>
          </div>
        </>
      )}
    </div>
  );
}
