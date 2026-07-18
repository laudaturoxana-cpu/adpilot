import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getMetaClient } from "@/lib/meta/connection";
import { handleApiError } from "@/lib/api/errors";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import type { CreateCampaignInput } from "@/types";

const META_RATE_LIMIT = 60;

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Neautentificat" }, { status: 401 });

  const rl = checkRateLimit(`meta:${user.id}`, META_RATE_LIMIT);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterSeconds);

  try {
    const { client, adAccountId } = await getMetaClient(user.id, supabase);
    if (!adAccountId) return NextResponse.json({ error: "Niciun cont de reclame selectat" }, { status: 400 });

    const campaigns = await client.getCampaigns(adAccountId);
    return NextResponse.json({ data: campaigns });
  } catch (err) {
    return handleApiError("GET /api/meta/campaigns", err, user.id);
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Neautentificat" }, { status: 401 });

  const rl = checkRateLimit(`meta:${user.id}`, META_RATE_LIMIT);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterSeconds);

  try {
    const body: CreateCampaignInput = await request.json();
    const { client, adAccountId } = await getMetaClient(user.id, supabase);
    if (!adAccountId) return NextResponse.json({ error: "Niciun cont de reclame selectat" }, { status: 400 });

    const campaign = await client.createCampaign(adAccountId, body);
    return NextResponse.json({ data: campaign }, { status: 201 });
  } catch (err) {
    return handleApiError("POST /api/meta/campaigns", err, user.id);
  }
}
