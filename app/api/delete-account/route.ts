import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * GDPR account deletion. Resolves the caller from the verified session cookie
 * (never trusts a client-sent id), then uses the service-role key to:
 *   1. detach the user's orders (user_id → null) so the records survive for
 *      business/legal purposes but hold no personal link,
 *   2. delete the profile row (all personal data),
 *   3. delete the auth account itself.
 * Returns 401 when unauthenticated, 200 on success.
 */
export async function POST() {
  // ---- resolve the caller from the session (don't trust the client) ----------
  let userId: string | null = null;
  try {
    const auth = createClient();
    const {
      data: { user },
    } = await auth.auth.getUser();
    userId = user?.id ?? null;
  } catch {
    userId = null;
  }

  if (!userId) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }

  const admin = createServiceClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // ---- 1. keep orders, but strip the personal link ---------------------------
  const { error: ordersError } = await admin
    .from("orders")
    .update({ user_id: null })
    .eq("user_id", userId);
  if (ordersError) {
    return NextResponse.json({ error: "delete_failed" }, { status: 500 });
  }

  // ---- 2. delete the profile (all personal data) -----------------------------
  const { error: profileError } = await admin.from("profiles").delete().eq("id", userId);
  if (profileError) {
    return NextResponse.json({ error: "delete_failed" }, { status: 500 });
  }

  // ---- 3. delete the auth account --------------------------------------------
  const { error: authError } = await admin.auth.admin.deleteUser(userId);
  if (authError) {
    return NextResponse.json({ error: "delete_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
