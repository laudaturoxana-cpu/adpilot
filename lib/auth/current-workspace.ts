import { cookies } from "next/headers";
import type { createClient } from "@/lib/supabase/server";
import { listUserWorkspaces } from "@/lib/auth/workspace";

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
