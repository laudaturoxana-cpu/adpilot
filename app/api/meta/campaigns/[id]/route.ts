import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getMetaClient } from "@/lib/meta/connection";
import { handleApiError } from "@/lib/api/errors";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import type { UpdateCampaignInput } from "@/types";

const META_RATE_LIMIT = 60;

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Neautentificat" }, { status: 401 });

  const rl = checkRateLimit(`meta:${user.id}`, META_RATE_LIMIT);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterSeconds);

  try {
    const { client } = await getMetaClient(user.id, supabase);
    const campaign = await client.getCampaign(id);
    return NextResponse.json({ data: campaign });
  } catch (err) {
    return handleApiError("GET /api/meta/campaigns/[id]", err, user.id);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Neautentificat" }, { status: 401 });

  const rl = checkRateLimit(`meta:${user.id}`, META_RATE_LIMIT);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterSeconds);

  try {
    const body: UpdateCampaignInput = await request.json();
    const { client } = await getMetaClient(user.id, supabase);
    const campaign = await client.updateCampaign(id, body);
    return NextResponse.json({ data: campaign });
  } catch (err) {
    return handleApiError("PUT /api/meta/campaigns/[id]", err, user.id);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Neautentificat" }, { status: 401 });

  const rl = checkRateLimit(`meta:${user.id}`, META_RATE_LIMIT);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterSeconds);

  try {
    const { client } = await getMetaClient(user.id, supabase);
    await client.deleteCampaign(id);
    return NextResponse.json({ message: "Campanie ștearsă" });
  } catch (err) {
    return handleApiError("DELETE /api/meta/campaigns/[id]", err, user.id);
  }
}
