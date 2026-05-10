import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const ids = req.nextUrl.searchParams.get("walletIds")?.split(",").filter(Boolean);
  if (!ids?.length) return NextResponse.json([]);

  const { data, error } = await supabase
    .from("agent_transactions")
    .select("*")
    .in("sub_wallet_id", ids)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return NextResponse.json([], { status: 500 });
  return NextResponse.json(data);
}
