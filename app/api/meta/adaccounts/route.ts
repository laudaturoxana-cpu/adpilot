import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveWorkspaceContext } from "@/lib/auth/current-workspace";
import { getMetaClient } from "@/lib/meta/connection";
import { handleApiError } from "@/lib/api/errors";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

const META_RATE_LIMIT = 60;

export async function GET() {
  const supabase = await createClient();
  try {
    const { user, workspaceId } = await resolveWorkspaceContext(supabase, "view_data");

    const rl = checkRateLimit(`meta:${user.id}`, META_RATE_LIMIT);
    if (!rl.allowed) return rateLimitResponse(rl.retryAfterSeconds);

    const { client } = await getMetaClient(supabase, workspaceId);
    const accounts = await client.getAdAccounts();

    // Persistăm conturile în ad_accounts (best-effort) pentru workspace.
    if (accounts.length > 0) {
      await supabase.from("ad_accounts").upsert(
        accounts.map((a) => ({
          workspace_id: workspaceId,
          meta_ad_account_id: a.id,
          name: a.name,
          currency: a.currency,
          timezone_name: a.timezone_name,
          account_status: a.account_status,
          amount_spent: a.amount_spent,
          updated_at: new Date().toISOString(),
        })),
        { onConflict: "workspace_id,meta_ad_account_id" }
      );
    }

    return NextResponse.json({ data: accounts });
  } catch (err) {
    return handleApiError("GET /api/meta/adaccounts", err);
  }
}
