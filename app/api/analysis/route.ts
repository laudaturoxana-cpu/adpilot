import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveWorkspaceContext } from "@/lib/auth/current-workspace";
import { getMetaClient } from "@/lib/meta/connection";
import { handleApiError } from "@/lib/api/errors";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { analyze, type EntityInput } from "@/lib/analysis/analyze";
import type { BusinessThresholds } from "@/lib/analysis/types";

const META_RATE_LIMIT = 60;
const DEFAULT_DAYS = 7;

/**
 * Analiză deterministă a campaniilor workspace-ului curent: KPI adaptat
 * obiectivului, reguli cu praguri de siguranță, scoring și recomandări
 * explicate. NU execută nicio acțiune (execuția e Etapa 5).
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  try {
    const { user, workspaceId } = await resolveWorkspaceContext(supabase, "view_data");

    const rl = checkRateLimit(`meta:${user.id}`, META_RATE_LIMIT);
    if (!rl.allowed) return rateLimitResponse(rl.retryAfterSeconds);

    const body = await request.json().catch(() => ({}));
    const days = Number.isFinite(body?.days) ? Math.max(1, Math.min(90, body.days)) : DEFAULT_DAYS;

    const { client, adAccountId } = await getMetaClient(supabase, workspaceId);
    if (!adAccountId) {
      return NextResponse.json({ error: "Niciun cont de reclame selectat" }, { status: 400 });
    }

    // Obiectivul per campanie (pentru evaluare adaptată).
    const campaigns = await client.getCampaigns(adAccountId);
    const objectiveByCampaign = new Map(campaigns.map((c) => [c.id, c.objective]));

    const until = new Date().toISOString().split("T")[0];
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const insights = await client.getInsights(adAccountId, { since, until }, "campaign");

    // Praguri de business (țintă CPA, ROAS minim) pentru deciziile financiare.
    const { data: bp } = await supabase
      .from("business_profiles")
      .select("target_cpa, min_roas, currency")
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    const thresholds: BusinessThresholds = {
      targetCpa: bp?.target_cpa ?? undefined,
      minRoas: bp?.min_roas ?? undefined,
      currency: bp?.currency ?? undefined,
    };

    const entities: EntityInput[] = insights.map((i) => ({
      id: i.campaign_id,
      name: i.campaign_name,
      level: "campaign",
      metaObjective: objectiveByCampaign.get(i.campaign_id),
      raw: i,
    }));

    const result = analyze(entities, thresholds, days);
    return NextResponse.json({ data: result });
  } catch (err) {
    return handleApiError("POST /api/analysis", err);
  }
}
