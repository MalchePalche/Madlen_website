import { NextResponse } from "next/server";
import { Resend } from "resend";
import { renderOrderConfirmationEmail, type OrderEmailData } from "@/lib/email/order-confirmation";

export const runtime = "nodejs";

// ---- in-memory rate limiting -------------------------------------------------
// Caps requests per client IP. Note: this Map lives in a single server process,
// so it resets on cold start and is not shared across serverless instances —
// adequate as a basic guard, not a distributed limiter.
const RATE_LIMIT_MAX = 3; // requests allowed per window
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

interface RateEntry {
  count: number;
  resetTime: number; // epoch ms when the window (and count) reset
}

const rateBuckets = new Map<string, RateEntry>();

/** Best-effort client IP from proxy headers (Vercel/NGINX set x-forwarded-for). */
function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

/** Returns true when the IP is over the limit. Counts the current request. */
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateBuckets.get(ip);

  if (!entry || now >= entry.resetTime) {
    // New window: start counting fresh and schedule the reset 10 min out.
    rateBuckets.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX;
}

/**
 * Sends an order-confirmation email via Resend. Called from checkout after the
 * order is inserted. Degrades gracefully: skips (200) when the customer left no
 * email or when RESEND_API_KEY is not configured, so checkout never breaks.
 */
export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Твърде много заявки. Моля, опитайте по-късно." },
      { status: 429 },
    );
  }

  let body: OrderEmailData;
  try {
    body = (await req.json()) as OrderEmailData;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body?.id || !Array.isArray(body.items) || !body.delivery_address) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  // ---- order validation ------------------------------------------------------
  // Field names follow DeliveryAddress (first_name maps to the "name" field).
  const a = body.delivery_address;
  const missing =
    !a.first_name?.trim() || !a.phone?.trim() || !a.address?.trim() || !a.city?.trim();
  if (missing) {
    return NextResponse.json(
      { error: "Липсват задължителни полета (име, телефон, адрес, град)." },
      { status: 400 },
    );
  }
  if (body.items.length === 0) {
    return NextResponse.json({ error: "Кошницата е празна." }, { status: 400 });
  }
  if (!(body.total_bgn > 0)) {
    return NextResponse.json({ error: "Невалидна сума на поръчката." }, { status: 400 });
  }

  const to = body.delivery_address.email?.trim();
  if (!to) return NextResponse.json({ skipped: true, reason: "no_email" });

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return NextResponse.json({ skipped: true, reason: "resend_not_configured" });

  const from = process.env.RESEND_FROM || "Noem Studio <onboarding@resend.dev>";
  const { subject, html, text } = renderOrderConfirmationEmail(body);

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({ from, to, subject, html, text });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    return NextResponse.json({ sent: true, id: data?.id });
  } catch {
    return NextResponse.json({ error: "send_failed" }, { status: 502 });
  }
}
