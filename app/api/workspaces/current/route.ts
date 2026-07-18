import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireUser, requireWorkspacePermission } from "@/lib/auth/workspace";
import { WORKSPACE_COOKIE } from "@/lib/auth/current-workspace";
import { handleApiError } from "@/lib/api/errors";

const bodySchema = z.object({ workspaceId: z.string().uuid() });
const ONE_YEAR = 60 * 60 * 24 * 365;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  try {
    const user = await requireUser(supabase);
    const { workspaceId } = bodySchema.parse(await request.json());
    // Doar membrii pot seta un workspace drept curent.
    await requireWorkspacePermission(supabase, workspaceId, user.id);

    const response = NextResponse.json({ ok: true });
    response.cookies.set(WORKSPACE_COOKIE, workspaceId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: ONE_YEAR,
    });
    return response;
  } catch (err) {
    return handleApiError("POST /api/workspaces/current", err);
  }
}
