import { MetaAPIClient } from "@/lib/meta/client";
import { decryptToken } from "@/lib/meta/auth";
import type { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export class MetaNotConnectedError extends Error {
  constructor(message = "Meta nu este conectat. Mergi la Setări pentru a conecta contul.") {
    super(message);
    this.name = "MetaNotConnectedError";
  }
}

interface MetaClientResult {
  client: MetaAPIClient;
  adAccountId: string | null;
}

/**
 * Helper server-side partajat: citește conexiunea Meta a userului, decriptează
 * token-ul și returnează un client + ad account-ul selectat. Elimină duplicarea
 * din rutele Meta (AGENTS.md §9).
 *
 * Aruncă MetaNotConnectedError dacă nu există conexiune activă.
 */
export async function getMetaClient(
  userId: string,
  supabase: SupabaseServerClient
): Promise<MetaClientResult> {
  const { data: connection } = await supabase
    .from("meta_connections")
    .select("access_token, selected_ad_account_id, is_active")
    .eq("user_id", userId)
    .single();

  if (!connection?.is_active) {
    throw new MetaNotConnectedError();
  }

  const token = decryptToken(connection.access_token);
  return {
    client: new MetaAPIClient(token),
    adAccountId: connection.selected_ad_account_id ?? null,
  };
}
