import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MetaAPIClient } from "@/lib/meta/client";
import { decryptToken } from "@/lib/meta/auth";
import { MetaAPIError } from "@/lib/meta/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") ?? "7");
  const level = (searchParams.get("level") ?? "campaign") as "account" | "campaign";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Neautentificat" }, { status: 401 });

  const { data: connection } = await supabase
    .from("meta_connections")
    .select("access_token, selected_ad_account_id, is_active")
    .eq("user_id", user.id)
    .single();

  if (!connection?.is_active || !connection.selected_ad_account_id) {
    return NextResponse.json({ error: "Meta nu este conectat sau niciun cont selectat" }, { status: 400 });
  }

  const adAccountId = connection.selected_ad_account_id;
  const cacheKey = `${adAccountId}-${days}-${level}`;

  // Check cache
  const { data: cached } = await supabase
    .from("insights_cache")
    .select("data, expires_at")
    .eq("user_id", user.id)
    .eq("ad_account_id", adAccountId)
    .eq("date_range", String(days))
    .order("cached_at", { ascending: false })
    .limit(1)
    .single();

  if (cached && new Date(cached.expires_at) > new Date()) {
    return NextResponse.json({ data: cached.data, fromCache: true });
  }

  try {
    const token = decryptToken(connection.access_token);
    const client = new MetaAPIClient(token);

    const until = new Date().toISOString().split("T")[0];
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const insights = await client.getInsights(adAccountId, { since, until }, level);

    // Save to cache
    await supabase.from("insights_cache").upsert({
      user_id: user.id,
      ad_account_id: adAccountId,
      date_range: String(days),
      data: insights,
      cached_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    });

    return NextResponse.json({ data: insights, fromCache: false });

  } catch (err) {
    if (err instanceof MetaAPIError) return NextResponse.json({ error: err.getUserMessage() }, { status: 400 });
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
