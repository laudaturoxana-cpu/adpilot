import type { User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { createClient } from "@/lib/supabase/server";
import {
  listUserWorkspaces,
  requireUser,
  requireWorkspacePermission,
  type Permission,
} from "@/lib/auth/workspace";
import { ForbiddenError } from "@/lib/auth/errors";
import type { WorkspaceRole } from "@/types";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export const WORKSPACE_COOKIE = "adpilot_ws";

/**
 * Determină workspace-ul curent al userului:
 *  1. dacă cookie-ul `adpilot_ws` indică un workspace din care face parte → acela
 *  2. altfel → primul workspace din lista lui
 *  3. dacă nu are niciunul → null
 *
 * Nu are încredere oarbă în cookie: valoarea e validată contra apartenenței
 * reale (RLS + membership), deci un cookie falsificat nu dă acces.
 */
export async function getCurrentWorkspaceId(
  supabase: SupabaseServerClient,
  userId: string
): Promise<string | null> {
  const cookieStore = await cookies();
  const cookieWs = cookieStore.get(WORKSPACE_COOKIE)?.value;

  const workspaces = await listUserWorkspaces(supabase, userId);
  if (workspaces.length === 0) return null;
  if (cookieWs && workspaces.some((w) => w.id === cookieWs)) return cookieWs;
  return workspaces[0].id;
}

export interface WorkspaceContext {
  user: User;
  workspaceId: string;
  role: WorkspaceRole;
}

/**
 * Rezolvă contextul unei cereri autentificate: user + workspace curent + rol,
 * verificând (opțional) o permisiune. Aruncă 401 dacă nu e autentificat, 403
 * dacă nu are workspace sau nu are permisiunea. Folosit de rutele Meta ca să
 * fie workspace-scoped uniform.
 */
export async function resolveWorkspaceContext(
  supabase: SupabaseServerClient,
  permission?: Permission
): Promise<WorkspaceContext> {
  const user = await requireUser(supabase);
  const workspaceId = await getCurrentWorkspaceId(supabase, user.id);
  if (!workspaceId) throw new ForbiddenError("Niciun workspace disponibil");
  const role = await requireWorkspacePermission(supabase, workspaceId, user.id, permission);
  return { user, workspaceId, role };
}
