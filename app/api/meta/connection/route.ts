import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveWorkspaceContext } from "@/lib/auth/current-workspace";
import { handleApiError } from "@/lib/api/errors";

/** Starea conexiunii Meta pentru workspace-ul curent (fără token). */
export async function GET() {
  const supabase = await createClient();
  try {
    const { workspaceId } = await resolveWorkspaceContext(supabase, "view_data");

    const { data } = await supabase
      .from("meta_connections")
      .select("meta_user_name, selected_ad_account_id, selected_ad_account_name, is_active, token_expires_at, needs_reauth")
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    if (!data || !data.is_active) {
      return NextResponse.json({ data: { connected: false } });
    }

    return NextResponse.json({
      data: {
        connected: true,
        meta_user_name: data.meta_user_name,
        selected_ad_account_id: data.selected_ad_account_id,
        selected_ad_account_name: data.selected_ad_account_name,
        token_expires_at: data.token_expires_at,
        needs_reauth: data.needs_reauth ?? false,
      },
    });
  } catch (err) {
    return handleApiError("GET /api/meta/connection", err);
  }
}
