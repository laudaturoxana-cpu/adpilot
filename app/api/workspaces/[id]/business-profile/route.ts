import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireUser, requireWorkspacePermission } from "@/lib/auth/workspace";
import { ForbiddenError } from "@/lib/auth/errors";
import { writeAuditLog } from "@/lib/audit/log";
import { handleApiError } from "@/lib/api/errors";

const businessProfileSchema = z.object({
  business_type: z.string().max(120).optional(),
  main_objective: z.string().max(120).optional(),
  products: z.string().max(2000).optional(),
  country: z.string().max(80).optional(),
  currency: z.string().max(10).optional(),
  monthly_budget: z.number().nonnegative().optional(),
  target_cpa: z.number().nonnegative().optional(),
  min_roas: z.number().nonnegative().optional(),
  avg_order_value: z.number().nonnegative().optional(),
  profit_margin: z.number().min(0).max(100).optional(),
  conversion_events: z.array(z.string().max(80)).max(50).optional(),
  landing_pages: z.array(z.string().url()).max(50).optional(),
  brand_voice: z.string().max(2000).optional(),
  forbidden_words: z.array(z.string().max(80)).max(200).optional(),
  regulated_industry: z.boolean().optional(),
  automation_level: z.number().int().min(0).max(5).optional(),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  try {
    const user = await requireUser(supabase);
    await requireWorkspacePermission(supabase, id, user.id, "view_data");

    const { data } = await supabase
      .from("business_profiles")
      .select("*")
      .eq("workspace_id", id)
      .maybeSingle();

    return NextResponse.json({ data: data ?? null });
  } catch (err) {
    return handleApiError("GET /api/workspaces/[id]/business-profile", err);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  try {
    const user = await requireUser(supabase);
    // Setările de business sunt sensibile — doar owner/admin le pot modifica.
    const role = await requireWorkspacePermission(supabase, id, user.id);
    if (role !== "owner" && role !== "admin") throw new ForbiddenError();

    const body = businessProfileSchema.parse(await request.json());

    const { data, error } = await supabase
      .from("business_profiles")
      .upsert({ workspace_id: id, ...body, updated_at: new Date().toISOString() }, { onConflict: "workspace_id" })
      .select()
      .single();
    if (error) throw error;

    await writeAuditLog(supabase, {
      workspaceId: id,
      actorId: user.id,
      action: "business_profile.update",
      entityType: "business_profile",
      entityId: id,
      afterState: body,
    });

    return NextResponse.json({ data });
  } catch (err) {
    return handleApiError("PUT /api/workspaces/[id]/business-profile", err);
  }
}
