import { KNOWN_TOKENS } from "./types";

const COINGECKO_IDS: Record<string, string> = {
  SOL: "solana",
  USDC: "usd-coin",
  USDT: "tether",
  JUP: "jupiter-exchange-solana",
  BONK: "bonk",
  RAY: "raydium",
};

export async function fetchPricesBySymbol(
  symbols: string[]
): Promise<Record<string, number>> {
  const ids = symbols
    .map((s) => COINGECKO_IDS[s])
    .filter(Boolean);
  if (ids.length === 0) return {};
  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(",")}&vs_currencies=usd`;
    const res = await fetch(url, { next: { revalidate: 30 } });
    if (!res.ok) return {};
    const json = (await res.json()) as Record<string, { usd: number }>;
    const out: Record<string, number> = {};
    for (const symbol of symbols) {
      const cgId = COINGECKO_IDS[symbol];
      if (cgId && json[cgId]?.usd) out[symbol] = json[cgId].usd;
    }
    return out;
  } catch {
    return {};
  }
}

export async function fetchTokenPrices(
  mints: string[]
): Promise<Record<string, number>> {
  const symbols = mints
    .map((m) => KNOWN_TOKENS.find((t) => t.mint === m)?.symbol)
    .filter(Boolean) as string[];
  const bySymbol = await fetchPricesBySymbol(symbols);
  const out: Record<string, number> = {};
  for (const [sym, price] of Object.entries(bySymbol)) {
    const mint = KNOWN_TOKENS.find((t) => t.symbol === sym)?.mint;
    if (mint) out[mint] = price;
  }
  return out;
}
