import { NextResponse } from "next/server";
import { generateOAuthState, buildMetaOAuthURL } from "@/lib/meta/auth";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceId } from "@/lib/auth/current-workspace";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
  }

  const workspaceId = await getCurrentWorkspaceId(supabase, user.id);
  if (!workspaceId) {
    return NextResponse.json({ error: "Niciun workspace disponibil" }, { status: 400 });
  }

  const state = generateOAuthState();
  const oauthUrl = buildMetaOAuthURL(state);

  const response = NextResponse.redirect(oauthUrl);
  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 600,
    path: "/",
  };
  response.cookies.set("meta_oauth_state", state, cookieOpts);
  // Reținem workspace-ul pe care legăm conexiunea Meta, pentru callback.
  response.cookies.set("meta_oauth_ws", workspaceId, cookieOpts);

  return response;
}
