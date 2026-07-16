import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { EMAIL_RE } from "@/lib/validation";

export const runtime = "nodejs";

// ---- in-memory rate limiting -------------------------------------------------
// Same pattern as app/api/create-order: per-IP cap within a rolling window,
// held in a per-process Map (resets on cold start; not distributed).
const RATE_LIMIT_MAX = 5; // signups allowed per window
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

/** Signup sources we record; anything else is coerced to "other". */
const SOURCES = new Set(["footer", "homepage", "checkout"]);

/**
 * Newsletter signup. Validates + normalises the email, then inserts with the
 * service-role key — the table has no RLS policies, so this route is the only
 * write path. Duplicate addresses are reported as `already: true` (not an
 * error): re-subscribing is a success from the visitor's point of view.
 */
export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Твърде много заявки. Моля, опитайте по-късно." },
      { status: 429 },
    );
  }

  let body: { email?: unknown; source?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Невалиден имейл адрес." }, { status: 400 });
  }

  const source =
    typeof body.source === "string" && SOURCES.has(body.source) ? body.source : "other";

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }

  const admin = createServiceClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await admin.from("newsletter_subscribers").insert({ email, source });

  if (error) {
    // 23505 = unique_violation → this address is already subscribed.
    if (error.code === "23505") {
      return NextResponse.json({ ok: true, already: true }, { status: 200 });
    }
    return NextResponse.json({ error: "signup_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
