import { MetaAPIClient } from "@/lib/meta/client";
import { ensureFreshToken } from "@/lib/meta/token-refresh";
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
  connectionId: string;
}

/**
 * Helper server-side partajat, workspace-scoped: găsește conexiunea Meta a
 * workspace-ului, asigură un token valid (refresh la nevoie) și returnează un
 * client + ad account-ul selectat. Elimină duplicarea din rutele Meta.
 *
 * Aruncă MetaNotConnectedError dacă workspace-ul nu are conexiune activă.
 */
export async function getMetaClient(
  supabase: SupabaseServerClient,
  workspaceId: string
): Promise<MetaClientResult> {
  const { data: connection } = await supabase
    .from("meta_connections")
    .select("id, access_token, selected_ad_account_id, is_active, token_expires_at")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (!connection?.is_active) {
    throw new MetaNotConnectedError();
  }

  const token = await ensureFreshToken(supabase, {
    id: connection.id,
    access_token: connection.access_token,
    token_expires_at: connection.token_expires_at,
  });

  return {
    client: new MetaAPIClient(token),
    adAccountId: connection.selected_ad_account_id ?? null,
    connectionId: connection.id,
  };
}
