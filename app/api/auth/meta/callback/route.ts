import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForToken, getLongLivedToken, encryptToken } from "@/lib/meta/auth";
import { MetaAPIClient } from "@/lib/meta/client";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (error) {
    return NextResponse.redirect(`${appUrl}/settings?error=meta_denied`);
  }

  const storedState = request.cookies.get("meta_oauth_state")?.value;
  if (!state || !storedState || state !== storedState) {
    return NextResponse.redirect(`${appUrl}/settings?error=invalid_state`);
  }

  if (!code) {
    return NextResponse.redirect(`${appUrl}/settings?error=no_code`);
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${appUrl}/login`);
  }

  // Workspace-ul pe care legăm conexiunea (setat la inițierea OAuth).
  const workspaceId = request.cookies.get("meta_oauth_ws")?.value;
  if (!workspaceId) {
    return NextResponse.redirect(`${appUrl}/settings?error=no_workspace`);
  }

  try {
    const shortToken = await exchangeCodeForToken(code);
    const longToken = await getLongLivedToken(shortToken.access_token);

    const metaClient = new MetaAPIClient(longToken.access_token);
    const metaUser = await metaClient.getMe();

    const encryptedToken = encryptToken(longToken.access_token);

    const expiresAt = longToken.expires_in
      ? new Date(Date.now() + longToken.expires_in * 1000).toISOString()
      : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();

    const { error: dbError } = await supabase
      .from("meta_connections")
      .upsert({
        user_id: user.id,
        workspace_id: workspaceId,
        access_token: encryptedToken,
        token_expires_at: expiresAt,
        meta_user_id: metaUser.id,
        meta_user_name: metaUser.name,
        is_active: true,
        needs_reauth: false,
        last_refreshed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: "workspace_id" });

    if (dbError) throw dbError;

    const response = NextResponse.redirect(`${appUrl}/settings?success=meta_connected`);
    response.cookies.delete("meta_oauth_state");
    response.cookies.delete("meta_oauth_ws");
    return response;

  } catch (err) {
    console.error("Meta OAuth callback error:", err);
    return NextResponse.redirect(`${appUrl}/settings?error=token_exchange_failed`);
  }
}
