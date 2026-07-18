import type { createClient } from "@/lib/supabase/server";
import type { AuditActorType } from "@/types";
import { logError } from "@/lib/api/errors";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export interface AuditEntryInput {
  workspaceId: string;
  actorId?: string | null;
  actorType?: AuditActorType;
  action: string;
  entityType?: string;
  entityId?: string;
  beforeState?: unknown;
  afterState?: unknown;
  reason?: string;
}

/**
 * Scrie o intrare append-only în audit_log. NU logăm niciodată secrete
 * (token-uri, chei) în before/after - apelantul e responsabil să nu le pună
 * (AGENTS.md §15).
 *
 * Eșecul de audit se loghează server-side dar NU aruncă - nu vrem ca o eroare
 * de audit să rupă operația principală deja executată.
 */
export async function writeAuditLog(
  supabase: SupabaseServerClient,
  entry: AuditEntryInput
): Promise<void> {
  const { error } = await supabase.from("audit_log").insert({
    workspace_id: entry.workspaceId,
    actor_id: entry.actorId ?? null,
    actor_type: entry.actorType ?? "user",
    action: entry.action,
    entity_type: entry.entityType ?? null,
    entity_id: entry.entityId ?? null,
    before_state: entry.beforeState ?? null,
    after_state: entry.afterState ?? null,
    reason: entry.reason ?? null,
  });

  if (error) {
    logError("writeAuditLog failed", error, entry.actorId ?? undefined);
  }
}
