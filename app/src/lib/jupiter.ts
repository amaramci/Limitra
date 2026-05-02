const JUPITER_PRICE_URL = "https://price.jup.ag/v6/price";

export async function fetchTokenPrices(
  mints: string[]
): Promise<Record<string, number>> {
  if (mints.length === 0) return {};
  try {
    const url = `${JUPITER_PRICE_URL}?ids=${mints.join(",")}`;
    const res = await fetch(url, { next: { revalidate: 30 } });
    if (!res.ok) return {};
    const json = (await res.json()) as {
      data: Record<string, { price: number }>;
    };
    const out: Record<string, number> = {};
    for (const [mint, info] of Object.entries(json.data)) {
      out[mint] = info.price;
    }
    return out;
  } catch {
    return {};
  }
}

// symbol → price (calls fetchTokenPrices with known mints)
import { KNOWN_TOKENS } from "./types";

export async function fetchPricesBySymbol(
  symbols: string[]
): Promise<Record<string, number>> {
  const mints = symbols
    .map((s) => KNOWN_TOKENS.find((t) => t.symbol === s)?.mint)
    .filter(Boolean) as string[];
  const byMint = await fetchTokenPrices(mints);
  const out: Record<string, number> = {};
  for (const [mint, price] of Object.entries(byMint)) {
    const sym = KNOWN_TOKENS.find((t) => t.mint === mint)?.symbol;
    if (sym) out[sym] = price;
  }
  return out;
}
