import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { refreshExpiringConnections } from "@/lib/meta/token-refresh";
import { handleApiError } from "@/lib/api/errors";

/**
 * Job de reîmprospătare a token-urilor Meta care expiră curând.
 * Protejat cu CRON_SECRET (header Authorization: Bearer <CRON_SECRET>).
 * Se programează din Vercel Cron.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  try {
    const service = createServiceClient();
    const result = await refreshExpiringConnections(service);
    return NextResponse.json({ data: result });
  } catch (err) {
    return handleApiError("GET /api/cron/refresh-tokens", err);
  }
}
