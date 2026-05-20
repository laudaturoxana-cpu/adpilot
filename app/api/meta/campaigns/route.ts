import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MetaAPIClient } from "@/lib/meta/client";
import { decryptToken } from "@/lib/meta/auth";
import { MetaAPIError } from "@/lib/meta/types";
import type { CreateCampaignInput } from "@/types";

async function getMetaClient(userId: string, supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: connection } = await supabase
    .from("meta_connections")
    .select("access_token, selected_ad_account_id, is_active")
    .eq("user_id", userId)
    .single();

  if (!connection?.is_active) throw new Error("Meta nu este conectat. Mergi la Setări pentru a conecta contul.");

  const token = decryptToken(connection.access_token);
  return {
    client: new MetaAPIClient(token),
    adAccountId: connection.selected_ad_account_id as string,
  };
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Neautentificat" }, { status: 401 });

  try {
    const { client, adAccountId } = await getMetaClient(user.id, supabase);
    if (!adAccountId) return NextResponse.json({ error: "Niciun cont de reclame selectat" }, { status: 400 });

    const campaigns = await client.getCampaigns(adAccountId);
    return NextResponse.json({ data: campaigns });

  } catch (err) {
    if (err instanceof MetaAPIError) {
      return NextResponse.json({ error: err.getUserMessage() }, { status: 400 });
    }
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Neautentificat" }, { status: 401 });

  try {
    const body: CreateCampaignInput = await request.json();
    const { client, adAccountId } = await getMetaClient(user.id, supabase);
    if (!adAccountId) return NextResponse.json({ error: "Niciun cont de reclame selectat" }, { status: 400 });

    const campaign = await client.createCampaign(adAccountId, body);
    return NextResponse.json({ data: campaign }, { status: 201 });

  } catch (err) {
    if (err instanceof MetaAPIError) {
      return NextResponse.json({ error: err.getUserMessage() }, { status: 400 });
    }
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
