import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveWorkspaceContext } from "@/lib/auth/current-workspace";
import { getMetaClient } from "@/lib/meta/connection";
import { handleApiError } from "@/lib/api/errors";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

const META_RATE_LIMIT = 60;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 oră

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") ?? "7");
  const level = (searchParams.get("level") ?? "campaign") as "account" | "campaign";

  const supabase = await createClient();
  try {
    const { user, workspaceId } = await resolveWorkspaceContext(supabase, "view_data");

    const rl = checkRateLimit(`meta:${user.id}`, META_RATE_LIMIT);
    if (!rl.allowed) return rateLimitResponse(rl.retryAfterSeconds);

    const { client, adAccountId } = await getMetaClient(supabase, workspaceId);
    if (!adAccountId) {
      return NextResponse.json({ error: "Niciun cont de reclame selectat" }, { status: 400 });
    }

    // Cheia de cache include level - altfel datele account-level și
    // campaign-level se suprascriau reciproc pentru aceeași perioadă.
    const cacheKey = `${days}-${level}`;

    const { data: cached } = await supabase
      .from("insights_cache")
      .select("data, expires_at")
      .eq("workspace_id", workspaceId)
      .eq("ad_account_id", adAccountId)
      .eq("date_range", cacheKey)
      .maybeSingle();

    if (cached && new Date(cached.expires_at) > new Date()) {
      return NextResponse.json({ data: cached.data, fromCache: true });
    }

    const until = new Date().toISOString().split("T")[0];
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const insights = await client.getInsights(adAccountId, { since, until }, level);

    await supabase.from("insights_cache").upsert(
      {
        user_id: user.id,
        workspace_id: workspaceId,
        ad_account_id: adAccountId,
        date_range: cacheKey,
        data: insights,
        cached_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + CACHE_TTL_MS).toISOString(),
      },
      { onConflict: "workspace_id,ad_account_id,date_range" }
    );

    return NextResponse.json({ data: insights, fromCache: false });
  } catch (err) {
    return handleApiError("GET /api/meta/insights", err);
  }
}
