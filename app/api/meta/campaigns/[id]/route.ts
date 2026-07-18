import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveWorkspaceContext } from "@/lib/auth/current-workspace";
import { getMetaClient } from "@/lib/meta/connection";
import { handleApiError } from "@/lib/api/errors";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { writeAuditLog } from "@/lib/audit/log";
import type { UpdateCampaignInput } from "@/types";

const META_RATE_LIMIT = 60;

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  try {
    const { user, workspaceId } = await resolveWorkspaceContext(supabase, "view_data");
    const rl = checkRateLimit(`meta:${user.id}`, META_RATE_LIMIT);
    if (!rl.allowed) return rateLimitResponse(rl.retryAfterSeconds);

    const { client } = await getMetaClient(supabase, workspaceId);
    const campaign = await client.getCampaign(id);
    return NextResponse.json({ data: campaign });
  } catch (err) {
    return handleApiError("GET /api/meta/campaigns/[id]", err);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  try {
    const { user, workspaceId } = await resolveWorkspaceContext(supabase, "execute");
    const rl = checkRateLimit(`meta:${user.id}`, META_RATE_LIMIT);
    if (!rl.allowed) return rateLimitResponse(rl.retryAfterSeconds);

    const body: UpdateCampaignInput = await request.json();
    const { client } = await getMetaClient(supabase, workspaceId);

    // Salvăm starea anterioară pentru audit + posibil rollback (Etapa 5).
    const before = await client.getCampaign(id);
    const campaign = await client.updateCampaign(id, body);

    await writeAuditLog(supabase, {
      workspaceId,
      actorId: user.id,
      action: "campaign.update",
      entityType: "campaign",
      entityId: id,
      beforeState: { status: before.status, daily_budget: before.daily_budget, lifetime_budget: before.lifetime_budget },
      afterState: body,
    });
    return NextResponse.json({ data: campaign });
  } catch (err) {
    return handleApiError("PUT /api/meta/campaigns/[id]", err);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  try {
    const { user, workspaceId } = await resolveWorkspaceContext(supabase, "execute");
    const rl = checkRateLimit(`meta:${user.id}`, META_RATE_LIMIT);
    if (!rl.allowed) return rateLimitResponse(rl.retryAfterSeconds);

    const { client } = await getMetaClient(supabase, workspaceId);
    const before = await client.getCampaign(id);
    await client.deleteCampaign(id);

    await writeAuditLog(supabase, {
      workspaceId,
      actorId: user.id,
      action: "campaign.delete",
      entityType: "campaign",
      entityId: id,
      beforeState: { name: before.name, status: before.status },
    });
    return NextResponse.json({ message: "Campanie ștearsă" });
  } catch (err) {
    return handleApiError("DELETE /api/meta/campaigns/[id]", err);
  }
}
