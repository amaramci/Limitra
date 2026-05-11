import type { Metadata } from "next";
import "./globals.css";
import { WalletProvider } from "@/components/WalletProvider";

export const metadata: Metadata = {
  title: "Smart Allowance Wallet",
  description: "Programmable wallet with restricted sub-wallets for AI agents",
  icons: { icon: "/logo.svg" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-surface-900">
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  );
}
