import { NextResponse, type NextRequest } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

/**
 * Auth code-exchange endpoint. Email confirmation and password-recovery links
 * land here with a `?code`; we exchange it for a session (sets cookies) and
 * redirect to `next`.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/akaunt";

  if (code && isSupabaseConfigured()) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  // Missing/invalid code — send to login with a hint.
  return NextResponse.redirect(`${origin}/vlez?error=auth`);
}
