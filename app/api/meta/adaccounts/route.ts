import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MetaAPIClient } from "@/lib/meta/client";
import { decryptToken } from "@/lib/meta/auth";
import { MetaAPIError } from "@/lib/meta/types";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Neautentificat" }, { status: 401 });

  const { data: connection } = await supabase
    .from("meta_connections")
    .select("access_token, is_active")
    .eq("user_id", user.id)
    .single();

  if (!connection?.is_active) {
    return NextResponse.json({ error: "Meta nu este conectat" }, { status: 400 });
  }

  try {
    const token = decryptToken(connection.access_token);
    const client = new MetaAPIClient(token);
    const accounts = await client.getAdAccounts();
    return NextResponse.json({ data: accounts });
  } catch (err) {
    if (err instanceof MetaAPIError) return NextResponse.json({ error: err.getUserMessage() }, { status: 400 });
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
