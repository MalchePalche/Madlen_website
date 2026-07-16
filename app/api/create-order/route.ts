import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { deliveryCost } from "@/lib/orders";
import type { CartItem, DeliveryAddress, EkontOffice } from "@/lib/types";

export const runtime = "nodejs";

// ---- in-memory rate limiting -------------------------------------------------
// Same pattern as app/api/confirm-order: caps requests per client IP within a
// rolling window. The Map lives in a single server process, so it resets on
// cold start and is not shared across serverless instances — a basic guard,
// not a distributed limiter.
const RATE_LIMIT_MAX = 3; // orders allowed per window
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
    rateBuckets.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX;
}

// ---- input sanitisation ------------------------------------------------------
/** Trim and strip any HTML tags so stored values can't be rendered as markup. */
function clean(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.replace(/<[^>]*>/g, "").trim();
}

const PHONE_RE = /^[0-9\s\-\+]{6,20}$/;

interface CreateOrderBody {
  id: string;
  items: CartItem[];
  total_bgn: number;
  delivery_address: DeliveryAddress;
}

/**
 * Server-side order creation. Inserts the order with the service-role key so it
 * runs regardless of RLS (the row's user_id is taken from the verified session,
 * never trusted from the client). Rate-limited and validated to stop COD spam
 * that the old client-side insert could not. Fires the confirmation email via
 * /api/confirm-order after a successful insert (best-effort).
 */
export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Твърде много заявки. Моля, опитайте по-късно." },
      { status: 429 },
    );
  }

  let body: CreateOrderBody;
  try {
    body = (await req.json()) as CreateOrderBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body?.id || !Array.isArray(body.items) || !body.delivery_address) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  // ---- sanitise + validate the delivery address ------------------------------
  const raw = body.delivery_address;

  // Econt office delivery: re-clean the office fields like any other client
  // input (the composed address/city/postcode strings are cleaned below).
  const toOffice = raw.delivery_method === "econt_office";
  let econtOffice: EkontOffice | undefined;
  if (toOffice) {
    const o = raw.econt_office;
    econtOffice = o && {
      id: Number(o.id) || 0,
      code: clean(o.code),
      name: clean(o.name),
      city: clean(o.city),
      post_code: clean(o.post_code),
      address: clean(o.address),
      is_aps: o.is_aps === true || undefined,
    };
    if (!econtOffice?.name || !econtOffice.city) {
      return NextResponse.json({ error: "Невалиден офис на Еконт." }, { status: 400 });
    }
  }

  const address: DeliveryAddress = {
    first_name: clean(raw.first_name),
    last_name: clean(raw.last_name),
    phone: clean(raw.phone),
    email: clean(raw.email) || undefined,
    address: clean(raw.address),
    city: clean(raw.city),
    postcode: clean(raw.postcode),
    note: clean(raw.note) || undefined,
    delivery_method: toOffice ? "econt_office" : "address",
    econt_office: econtOffice,
  };

  const missing =
    !address.first_name ||
    !address.last_name ||
    !address.phone ||
    !address.address ||
    !address.city;
  if (missing) {
    return NextResponse.json(
      { error: "Липсват задължителни полета (име, фамилия, телефон, адрес, град)." },
      { status: 400 },
    );
  }
  if (!PHONE_RE.test(address.phone)) {
    return NextResponse.json({ error: "Невалиден телефонен номер." }, { status: 400 });
  }
  if (body.items.length === 0) {
    return NextResponse.json({ error: "Кошницата е празна." }, { status: 400 });
  }
  if (!(body.total_bgn > 0)) {
    return NextResponse.json({ error: "Невалидна сума на поръчката." }, { status: 400 });
  }

  // ---- resolve the buyer from the session (don't trust a client-sent id) -----
  let userId: string | null = null;
  try {
    const auth = createClient();
    const {
      data: { user },
    } = await auth.auth.getUser();
    userId = user?.id ?? null;
  } catch {
    userId = null; // guest checkout
  }

  // ---- insert with the service-role key (bypasses RLS) -----------------------
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }

  const admin = createServiceClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // ---- verify item prices server-side (never trust client-sent amounts) ------
  // Look up the real price for every product by its (unique) slug and reject if
  // any client-sent price drifts from it by more than one cent. The order total
  // is then recomputed from these verified prices, not from the client payload,
  // so a tampered cart can't lower what gets charged/recorded.
  const slugs = Array.from(new Set(body.items.map((i) => i.slug).filter(Boolean)));
  const { data: dbProducts, error: priceErr } = await admin
    .from("products")
    .select("slug, price_bgn")
    .in("slug", slugs);
  if (priceErr) {
    return NextResponse.json({ error: "order_failed" }, { status: 500 });
  }

  const priceBySlug = new Map<string, number>(
    (dbProducts ?? []).map((p) => [p.slug as string, Number(p.price_bgn)]),
  );

  let subtotal = 0;
  for (const item of body.items) {
    const real = priceBySlug.get(item.slug);
    if (real === undefined || !Number.isFinite(real)) {
      return NextResponse.json({ error: "Невалидна цена на продукт" }, { status: 400 });
    }
    // Compare in integer cents so floating-point noise can't trip the check.
    const realCents = Math.round(real * 100);
    const sentCents = Math.round(Number(item.price_bgn) * 100);
    if (!Number.isFinite(sentCents) || Math.abs(realCents - sentCents) > 1) {
      return NextResponse.json({ error: "Невалидна цена на продукт" }, { status: 400 });
    }
    const qty = Math.trunc(Number(item.quantity));
    if (!Number.isFinite(qty) || qty <= 0) {
      return NextResponse.json({ error: "Невалидно количество на продукт." }, { status: 400 });
    }
    subtotal += real * qty;
  }
  subtotal = Math.round(subtotal * 100) / 100;
  const delivery = deliveryCost(subtotal);
  const verifiedTotal = Math.round((subtotal + delivery) * 100) / 100;

  const { error } = await admin.from("orders").insert({
    id: body.id,
    user_id: userId,
    items: body.items,
    total_bgn: verifiedTotal,
    delivery_address: address,
    payment_method: "cod",
    status: "pending",
  });
  if (error) {
    return NextResponse.json({ error: "order_failed" }, { status: 500 });
  }

  // ---- fire the confirmation email (best-effort, never blocks the order) -----
  if (address.email) {
    try {
      await fetch(new URL("/api/confirm-order", req.url), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Forward the real client IP so confirm-order's limiter keys on the
          // customer, not this server's address.
          "x-forwarded-for": ip,
        },
        body: JSON.stringify({
          id: body.id,
          items: body.items,
          // use the server-verified amounts, not the client payload
          subtotal,
          delivery,
          total_bgn: verifiedTotal,
          delivery_address: address,
        }),
      });
    } catch {
      /* email is best-effort; the order is already placed */
    }
  }

  return NextResponse.json({ id: body.id }, { status: 200 });
}
