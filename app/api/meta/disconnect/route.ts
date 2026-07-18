import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveWorkspaceContext } from "@/lib/auth/current-workspace";
import { writeAuditLog } from "@/lib/audit/log";
import { handleApiError } from "@/lib/api/errors";

export async function POST() {
  const supabase = await createClient();
  try {
    // Deconectarea Meta e sensibilă - doar owner/admin.
    const { user, workspaceId, role } = await resolveWorkspaceContext(supabase, "manage_automation");
    void role;

    const { error } = await supabase
      .from("meta_connections")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("workspace_id", workspaceId);
    if (error) throw error;

    await writeAuditLog(supabase, {
      workspaceId,
      actorId: user.id,
      action: "meta.disconnect",
      entityType: "meta_connection",
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError("POST /api/meta/disconnect", err);
  }
}
