import type { User } from "@supabase/supabase-js";
import type { createClient } from "@/lib/supabase/server";
import type { WorkspaceRole, WorkspaceWithRole } from "@/types";
import { UnauthenticatedError, ForbiddenError } from "@/lib/auth/errors";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

// ── Permisiuni (capabilități) ────────────────────────────────────────────
export type Permission =
  | "view_data"
  | "propose"
  | "approve"
  | "execute"
  | "manage_automation"
  | "manage_members"
  | "manage_billing";

/**
 * Maparea rol → permisiuni. Sursa unică de adevăr pentru RBAC în aplicație.
 * RLS-ul din DB rămâne verificarea primară; asta e defense in depth la nivel
 * de API (CLAUDE.md §RLS).
 */
export const ROLE_PERMISSIONS: Record<WorkspaceRole, Permission[]> = {
  owner: ["view_data", "propose", "approve", "execute", "manage_automation", "manage_members", "manage_billing"],
  admin: ["view_data", "propose", "approve", "execute", "manage_automation", "manage_members"],
  media_buyer: ["view_data", "propose", "approve", "execute"],
  strategist: ["view_data", "propose"],
  creative: ["view_data", "propose"],
  approver: ["view_data", "approve"],
  client: ["view_data", "approve"],
  viewer: ["view_data"],
};

export function hasPermission(role: WorkspaceRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

// ── Guards & lookups ───────────────────────────────────────────────────────

/** Returnează userul autentificat sau aruncă UnauthenticatedError (401). */
export async function requireUser(supabase: SupabaseServerClient): Promise<User> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new UnauthenticatedError();
  return user;
}

/** Rolul userului într-un workspace, sau null dacă nu e membru. */
export async function getWorkspaceRole(
  supabase: SupabaseServerClient,
  workspaceId: string,
  userId: string
): Promise<WorkspaceRole | null> {
  const { data } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle();
  return (data?.role as WorkspaceRole | undefined) ?? null;
}

/** Workspace-urile userului, cu rolul lui în fiecare. */
export async function listUserWorkspaces(
  supabase: SupabaseServerClient,
  userId: string
): Promise<WorkspaceWithRole[]> {
  const { data, error } = await supabase
    .from("workspace_members")
    .select("role, workspaces(id, name, owner_id, plan, created_at, updated_at)")
    .eq("user_id", userId);

  if (error || !data) return [];

  return data
    .filter((row) => row.workspaces)
    .map((row) => {
      const ws = row.workspaces as unknown as WorkspaceWithRole;
      return { ...ws, role: row.role as WorkspaceRole };
    });
}

/**
 * Verifică apartenența la workspace și (opțional) o permisiune. Aruncă
 * ForbiddenError (403) dacă userul nu e membru sau nu are permisiunea.
 * Ownership check server-side obligatoriu (AGENTS.md §3).
 */
export async function requireWorkspacePermission(
  supabase: SupabaseServerClient,
  workspaceId: string,
  userId: string,
  permission?: Permission
): Promise<WorkspaceRole> {
  const role = await getWorkspaceRole(supabase, workspaceId, userId);
  if (!role) throw new ForbiddenError("Nu ai acces la acest workspace");
  if (permission && !hasPermission(role, permission)) {
    throw new ForbiddenError();
  }
  return role;
}
