import { encryptToken, decryptToken, getLongLivedToken } from "@/lib/meta/auth";
import { logError } from "@/lib/api/errors";
import type { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

type AnySupabase = Awaited<ReturnType<typeof createClient>> | SupabaseClient;

// Reîmprospătăm dacă token-ul expiră în mai puțin de 7 zile.
const REFRESH_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000;
const DEFAULT_TTL_MS = 60 * 24 * 60 * 60 * 1000; // ~60 zile

export interface ConnectionTokenRow {
  id: string;
  access_token: string;
  token_expires_at: string | null;
}

function computeExpiry(expiresInSeconds?: number): string {
  const ms = expiresInSeconds ? expiresInSeconds * 1000 : DEFAULT_TTL_MS;
  return new Date(Date.now() + ms).toISOString();
}

/**
 * Returnează un access token valid (în clar) pentru o conexiune. Dacă expiră
 * curând, încearcă re-exchange-ul long-lived și persistă noul token criptat.
 * La eșec (permisiuni retrase / token invalidat), marchează needs_reauth și
 * returnează token-ul curent - lăsăm apelul Meta să eșueze cu mesaj clar.
 */
export async function ensureFreshToken(
  supabase: AnySupabase,
  connection: ConnectionTokenRow
): Promise<string> {
  const current = decryptToken(connection.access_token);
  const expiresAt = connection.token_expires_at ? new Date(connection.token_expires_at).getTime() : 0;
  const expiresSoon = expiresAt > 0 && expiresAt - Date.now() < REFRESH_THRESHOLD_MS;
  if (!expiresSoon) return current;

  try {
    const refreshed = await getLongLivedToken(current);
    await supabase
      .from("meta_connections")
      .update({
        access_token: encryptToken(refreshed.access_token),
        token_expires_at: computeExpiry(refreshed.expires_in),
        last_refreshed_at: new Date().toISOString(),
        needs_reauth: false,
      })
      .eq("id", connection.id);
    return refreshed.access_token;
  } catch (err) {
    logError("ensureFreshToken failed", err);
    await supabase.from("meta_connections").update({ needs_reauth: true }).eq("id", connection.id);
    return current;
  }
}

/**
 * Job: reîmprospătează token-urile conexiunilor active care expiră curând.
 * Folosește un client service-role (bypass RLS) pentru a itera toate
 * workspace-urile. Apelat din /api/cron/refresh-tokens.
 */
export async function refreshExpiringConnections(
  serviceClient: SupabaseClient
): Promise<{ processed: number; refreshed: number; failed: number }> {
  const threshold = new Date(Date.now() + REFRESH_THRESHOLD_MS).toISOString();
  const { data: connections } = await serviceClient
    .from("meta_connections")
    .select("id, access_token, token_expires_at")
    .eq("is_active", true)
    .lt("token_expires_at", threshold);

  const rows = (connections ?? []) as ConnectionTokenRow[];
  let refreshed = 0;
  let failed = 0;

  for (const row of rows) {
    try {
      const before = row.token_expires_at;
      await ensureFreshToken(serviceClient, row);
      const { data: after } = await serviceClient
        .from("meta_connections")
        .select("token_expires_at, needs_reauth")
        .eq("id", row.id)
        .maybeSingle();
      if (after?.needs_reauth) failed++;
      else if (after?.token_expires_at !== before) refreshed++;
    } catch (err) {
      logError("refreshExpiringConnections row failed", err);
      failed++;
    }
  }

  return { processed: rows.length, refreshed, failed };
}
