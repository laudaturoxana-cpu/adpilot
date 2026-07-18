import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getMetaClient } from "@/lib/meta/connection";
import { handleApiError } from "@/lib/api/errors";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

const META_RATE_LIMIT = 60;

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Neautentificat" }, { status: 401 });

  const rl = checkRateLimit(`meta:${user.id}`, META_RATE_LIMIT);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterSeconds);

  try {
    const { client } = await getMetaClient(user.id, supabase);
    const accounts = await client.getAdAccounts();
    return NextResponse.json({ data: accounts });
  } catch (err) {
    return handleApiError("GET /api/meta/adaccounts", err, user.id);
  }
}
