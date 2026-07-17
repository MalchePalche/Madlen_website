import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { sanitizeText } from "@/lib/validation";

export const runtime = "nodejs";

// ---- in-memory rate limiting -------------------------------------------------
// Same pattern as app/api/newsletter and app/api/create-order: per-IP cap
// within a rolling window, held in a per-process Map (resets on cold start;
// not distributed). Guards the public submit endpoint against spam.
const RATE_LIMIT_MAX = 5; // reviews allowed per window
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

interface RateEntry {
  count: number;
  resetTime: number;
}

const rateBuckets = new Map<string, RateEntry>();

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateBuckets.get(ip);
  if (!entry || now >= entry.resetTime) {
    rateBuckets.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX;
}

// UUID v4-ish shape check — cheap gate before touching the database.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const NAME_MAX = 80;
const COMMENT_MAX = 2000;

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createServiceClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

interface CreateReviewBody {
  product_id?: unknown;
  author_name?: unknown;
  rating?: unknown;
  comment?: unknown;
}

/**
 * Submit a product review. Validated + rate-limited, then inserted with the
 * service-role key. Every review lands `is_approved = false` and stays hidden
 * from the public GET until an admin approves it via /api/admin/reviews.
 * Response: 200 `{ ok: true }` on success.
 */
export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Твърде много заявки. Моля, опитайте по-късно." },
      { status: 429 },
    );
  }

  let body: CreateReviewBody;
  try {
    body = (await req.json()) as CreateReviewBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const productId = typeof body.product_id === "string" ? body.product_id.trim() : "";
  if (!UUID_RE.test(productId)) {
    return NextResponse.json({ error: "Невалиден продукт." }, { status: 400 });
  }

  const authorName =
    typeof body.author_name === "string" ? sanitizeText(body.author_name).slice(0, NAME_MAX) : "";
  if (authorName.length < 2) {
    return NextResponse.json({ error: "Моля, въведете вашето име." }, { status: 400 });
  }

  // Rating must be a whole number 1–5.
  const rating = Math.trunc(Number(body.rating));
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Оценката трябва да е между 1 и 5." }, { status: 400 });
  }

  // Comment is optional; strip tags + cap length, store null when empty.
  const commentRaw =
    typeof body.comment === "string" ? sanitizeText(body.comment).slice(0, COMMENT_MAX) : "";
  const comment = commentRaw.length > 0 ? commentRaw : null;

  const admin = serviceClient();
  if (!admin) {
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }

  const { error } = await admin.from("reviews").insert({
    product_id: productId,
    author_name: authorName,
    rating,
    comment,
    is_approved: false,
  });

  if (error) {
    // 23503 = foreign_key_violation → the product_id doesn't exist.
    if (error.code === "23503") {
      return NextResponse.json({ error: "Невалиден продукт." }, { status: 400 });
    }
    return NextResponse.json({ error: "review_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}

/**
 * Approved reviews for one product, plus the aggregate rating.
 * GET /api/reviews?product_id=<uuid>
 * Response: 200 `{ reviews, average, count }` where `reviews` are approved
 * only (newest first), `average` is rounded to one decimal (0 when none),
 * and `count` is the number of approved reviews.
 */
export async function GET(req: Request) {
  const productId = new URL(req.url).searchParams.get("product_id")?.trim() ?? "";
  if (!UUID_RE.test(productId)) {
    return NextResponse.json({ error: "missing_product_id" }, { status: 400 });
  }

  const admin = serviceClient();
  if (!admin) {
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }

  // Service-role bypasses RLS, so filter approved explicitly and never select
  // is_approved — the public payload must not leak moderation state.
  const { data, error } = await admin
    .from("reviews")
    .select("id, product_id, author_name, rating, comment, created_at")
    .eq("product_id", productId)
    .eq("is_approved", true)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "fetch_failed" }, { status: 500 });
  }

  const reviews = data ?? [];
  const count = reviews.length;
  const average =
    count > 0
      ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / count) * 10) / 10
      : 0;

  return NextResponse.json({ reviews, average, count }, { status: 200 });
}
