import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireUser, requireWorkspacePermission } from "@/lib/auth/workspace";
import { handleApiError } from "@/lib/api/errors";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  try {
    const user = await requireUser(supabase);
    await requireWorkspacePermission(supabase, id, user.id, "view_data");

    const { data, error } = await supabase
      .from("workspace_members")
      .select("id, role, created_at, user_id, profiles(email, full_name)")
      .eq("workspace_id", id)
      .order("created_at", { ascending: true });
    if (error) throw error;

    return NextResponse.json({ data: data ?? [] });
  } catch (err) {
    return handleApiError("GET /api/workspaces/[id]/members", err);
  }
}
