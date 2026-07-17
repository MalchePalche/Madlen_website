import { NextResponse } from "next/server";
import { createClient as createServiceClient, type SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function serviceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createServiceClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Gate an admin request. Resolves the caller from the verified session cookie
 * and checks profiles.is_admin — the same rule enforced by middleware for the
 * /admin pages. Returns the service-role client on success, or a NextResponse
 * error (401 unauthenticated / 403 forbidden / 500 misconfigured) to return.
 */
async function requireAdmin(): Promise<SupabaseClient | NextResponse> {
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

  const admin = serviceClient();
  if (!admin) {
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .maybeSingle();
  if (!profile?.is_admin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  return admin;
}

const STATUSES = new Set(["pending", "approved", "all"]);

/**
 * Moderation queue. GET /api/admin/reviews?status=pending|approved|all
 * (defaults to pending). Returns every column incl. is_approved, newest first,
 * plus counts for the tabs.
 * Response: 200 `{ reviews, counts: { pending, approved, total } }`.
 */
export async function GET(req: Request) {
  const gate = await requireAdmin();
  if (gate instanceof NextResponse) return gate;
  const admin = gate;

  const statusParam = new URL(req.url).searchParams.get("status") ?? "pending";
  const status = STATUSES.has(statusParam) ? statusParam : "pending";

  let query = admin
    .from("reviews")
    .select("id, product_id, author_name, rating, comment, is_approved, created_at");
  if (status === "pending") query = query.eq("is_approved", false);
  else if (status === "approved") query = query.eq("is_approved", true);

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json({ error: "fetch_failed" }, { status: 500 });
  }

  // Head-only count queries — cheap, no rows transferred.
  const [{ count: pending }, { count: approved }] = await Promise.all([
    admin.from("reviews").select("*", { count: "exact", head: true }).eq("is_approved", false),
    admin.from("reviews").select("*", { count: "exact", head: true }).eq("is_approved", true),
  ]);

  return NextResponse.json(
    {
      reviews: data ?? [],
      counts: {
        pending: pending ?? 0,
        approved: approved ?? 0,
        total: (pending ?? 0) + (approved ?? 0),
      },
    },
    { status: 200 },
  );
}

interface ModerateBody {
  id?: unknown;
  action?: unknown;
}

/**
 * Approve or reject a pending review.
 * PATCH /api/admin/reviews  body `{ id: <uuid>, action: "approve" | "reject" }`
 *   • approve → is_approved = true (review becomes public)
 *   • reject  → the row is deleted
 * Response: 200 `{ ok: true }`; 404 when the id doesn't exist.
 */
export async function PATCH(req: Request) {
  const gate = await requireAdmin();
  if (gate instanceof NextResponse) return gate;
  const admin = gate;

  let body: ModerateBody;
  try {
    body = (await req.json()) as ModerateBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const id = typeof body.id === "string" ? body.id.trim() : "";
  const action = body.action;
  if (!UUID_RE.test(id) || (action !== "approve" && action !== "reject")) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  if (action === "approve") {
    const { data, error } = await admin
      .from("reviews")
      .update({ is_approved: true })
      .eq("id", id)
      .select("id");
    if (error) return NextResponse.json({ error: "update_failed" }, { status: 500 });
    if (!data || data.length === 0) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
  } else {
    const { data, error } = await admin.from("reviews").delete().eq("id", id).select("id");
    if (error) return NextResponse.json({ error: "delete_failed" }, { status: 500 });
    if (!data || data.length === 0) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
