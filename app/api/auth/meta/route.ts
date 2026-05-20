import { NextResponse } from "next/server";
import { generateOAuthState, buildMetaOAuthURL } from "@/lib/meta/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
  }

  const state = generateOAuthState();
  const oauthUrl = buildMetaOAuthURL(state);

  const response = NextResponse.redirect(oauthUrl);
  response.cookies.set("meta_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return response;
}
