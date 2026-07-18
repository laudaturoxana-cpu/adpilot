import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireUser, listUserWorkspaces } from "@/lib/auth/workspace";
import { writeAuditLog } from "@/lib/audit/log";
import { handleApiError } from "@/lib/api/errors";
import type { Workspace } from "@/types";

const createSchema = z.object({
  name: z.string().trim().min(1, "Nume obligatoriu").max(80),
});

export async function GET() {
  const supabase = await createClient();
  try {
    const user = await requireUser(supabase);
    const workspaces = await listUserWorkspaces(supabase, user.id);
    return NextResponse.json({ data: workspaces });
  } catch (err) {
    return handleApiError("GET /api/workspaces", err);
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  try {
    const user = await requireUser(supabase);
    const { name } = createSchema.parse(await request.json());

    // Creare atomică workspace + membership owner prin RPC (SECURITY DEFINER).
    const { data, error } = await supabase.rpc("create_workspace", { ws_name: name });
    if (error) throw error;

    const workspace = data as Workspace;
    await writeAuditLog(supabase, {
      workspaceId: workspace.id,
      actorId: user.id,
      action: "workspace.create",
      entityType: "workspace",
      entityId: workspace.id,
      afterState: { name: workspace.name },
    });

    return NextResponse.json({ data: workspace }, { status: 201 });
  } catch (err) {
    return handleApiError("POST /api/workspaces", err);
  }
}
