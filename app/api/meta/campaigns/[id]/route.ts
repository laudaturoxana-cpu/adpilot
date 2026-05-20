import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MetaAPIClient } from "@/lib/meta/client";
import { decryptToken } from "@/lib/meta/auth";
import { MetaAPIError } from "@/lib/meta/types";
import type { UpdateCampaignInput } from "@/types";

async function getMetaClient(userId: string, supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: connection } = await supabase
    .from("meta_connections")
    .select("access_token, is_active")
    .eq("user_id", userId)
    .single();

  if (!connection?.is_active) throw new Error("Meta nu este conectat");
  const token = decryptToken(connection.access_token);
  return new MetaAPIClient(token);
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Neautentificat" }, { status: 401 });

  try {
    const client = await getMetaClient(user.id, supabase);
    const campaign = await client.getCampaign(id);
    return NextResponse.json({ data: campaign });
  } catch (err) {
    if (err instanceof MetaAPIError) return NextResponse.json({ error: err.getUserMessage() }, { status: 400 });
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Neautentificat" }, { status: 401 });

  try {
    const body: UpdateCampaignInput = await request.json();
    const client = await getMetaClient(user.id, supabase);
    const campaign = await client.updateCampaign(id, body);
    return NextResponse.json({ data: campaign });
  } catch (err) {
    if (err instanceof MetaAPIError) return NextResponse.json({ error: err.getUserMessage() }, { status: 400 });
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Neautentificat" }, { status: 401 });

  try {
    const client = await getMetaClient(user.id, supabase);
    await client.deleteCampaign(id);
    return NextResponse.json({ message: "Campanie ștearsă" });
  } catch (err) {
    if (err instanceof MetaAPIError) return NextResponse.json({ error: err.getUserMessage() }, { status: 400 });
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
