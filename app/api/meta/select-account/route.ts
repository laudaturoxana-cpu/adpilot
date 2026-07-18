import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { resolveWorkspaceContext } from "@/lib/auth/current-workspace";
import { writeAuditLog } from "@/lib/audit/log";
import { handleApiError } from "@/lib/api/errors";

const schema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  try {
    const { user, workspaceId } = await resolveWorkspaceContext(supabase, "execute");
    const { id, name } = schema.parse(await request.json());

    const { error } = await supabase
      .from("meta_connections")
      .update({
        selected_ad_account_id: id,
        selected_ad_account_name: name,
        updated_at: new Date().toISOString(),
      })
      .eq("workspace_id", workspaceId);
    if (error) throw error;

    // Reflectăm selecția și în ad_accounts (best-effort).
    await supabase.from("ad_accounts").update({ is_selected: false }).eq("workspace_id", workspaceId);
    await supabase
      .from("ad_accounts")
      .update({ is_selected: true })
      .eq("workspace_id", workspaceId)
      .eq("meta_ad_account_id", id);

    await writeAuditLog(supabase, {
      workspaceId,
      actorId: user.id,
      action: "meta.select_account",
      entityType: "ad_account",
      entityId: id,
      afterState: { name },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError("POST /api/meta/select-account", err);
  }
}
