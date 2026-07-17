import { NextResponse } from "next/server";
import { runDigest } from "@/lib/email/send-digest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Give batch sends room to complete (a large list = several Resend calls).
export const maxDuration = 60;

/**
 * Authorise a digest run. Two accepted credentials, both checked against the
 * single CRON_SECRET env var:
 *   - `Authorization: Bearer <CRON_SECRET>` — Vercel Cron sends this header
 *     automatically when CRON_SECRET is set.
 *   - `?secret=<CRON_SECRET>` — for manual/browser-triggered test sends.
 *
 * Fails CLOSED: if CRON_SECRET is not configured, nothing is authorised. This
 * endpoint blasts a marketing email to every subscriber, so it must never be
 * open to the public.
 */
function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const auth = req.headers.get("authorization");
  if (auth && auth === `Bearer ${secret}`) return true;

  const qp = new URL(req.url).searchParams.get("secret");
  return qp === secret;
}

async function handle(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const result = await runDigest();
    return NextResponse.json(result, { status: result.ok || result.skipped ? 200 : 500 });
  } catch {
    return NextResponse.json({ ok: false, error: "digest_failed" }, { status: 500 });
  }
}

// Vercel Cron issues a GET. POST is accepted too for convenience (e.g. curl).
export async function GET(req: Request) {
  return handle(req);
}

export async function POST(req: Request) {
  return handle(req);
}
