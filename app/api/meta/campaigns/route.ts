import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveWorkspaceContext } from "@/lib/auth/current-workspace";
import { getMetaClient } from "@/lib/meta/connection";
import { handleApiError } from "@/lib/api/errors";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { writeAuditLog } from "@/lib/audit/log";
import type { CreateCampaignInput } from "@/types";

const META_RATE_LIMIT = 60;

export async function GET() {
  const supabase = await createClient();
  try {
    const { user, workspaceId } = await resolveWorkspaceContext(supabase, "view_data");

    const rl = checkRateLimit(`meta:${user.id}`, META_RATE_LIMIT);
    if (!rl.allowed) return rateLimitResponse(rl.retryAfterSeconds);

    const { client, adAccountId } = await getMetaClient(supabase, workspaceId);
    if (!adAccountId) return NextResponse.json({ error: "Niciun cont de reclame selectat" }, { status: 400 });

    const campaigns = await client.getCampaigns(adAccountId);
    return NextResponse.json({ data: campaigns });
  } catch (err) {
    return handleApiError("GET /api/meta/campaigns", err);
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  try {
    const { user, workspaceId } = await resolveWorkspaceContext(supabase, "execute");

    const rl = checkRateLimit(`meta:${user.id}`, META_RATE_LIMIT);
    if (!rl.allowed) return rateLimitResponse(rl.retryAfterSeconds);

    const body: CreateCampaignInput = await request.json();
    const { client, adAccountId } = await getMetaClient(supabase, workspaceId);
    if (!adAccountId) return NextResponse.json({ error: "Niciun cont de reclame selectat" }, { status: 400 });

    const campaign = await client.createCampaign(adAccountId, body);
    await writeAuditLog(supabase, {
      workspaceId,
      actorId: user.id,
      action: "campaign.create",
      entityType: "campaign",
      entityId: campaign.id,
      afterState: { name: campaign.name, status: campaign.status, objective: campaign.objective },
    });
    return NextResponse.json({ data: campaign }, { status: 201 });
  } catch (err) {
    return handleApiError("POST /api/meta/campaigns", err);
  }
}
