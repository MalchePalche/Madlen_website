import { createClient as createServiceClient, type SupabaseClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { SITE_URL } from "@/lib/config";
import { renderNewsletterDigestEmail, type DigestProduct } from "./newsletter-digest";
import type { Product } from "@/lib/types";

/** Outcome of a digest run, returned by the cron + manual-trigger endpoints. */
export interface DigestResult {
  ok: boolean;
  /** True when the run intentionally sent nothing (see `reason`). */
  skipped?: boolean;
  reason?: string;
  qualifyingProducts?: number;
  recipients?: number;
  sent?: number;
  failed?: number;
}

/** Resend accepts at most 100 messages per batch call. */
const BATCH_SIZE = 100;

function getAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createServiceClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Map a product row to the trimmed shape the email template needs. */
function toDigestProduct(p: Product): DigestProduct {
  return {
    slug: p.slug,
    name_bg: p.name_bg,
    price_bgn: Number(p.price_bgn),
    compare_at_bgn: p.compare_at_bgn == null ? null : Number(p.compare_at_bgn),
    image: p.images?.[0] ?? null,
    is_new: p.is_new,
  };
}

/**
 * Run the daily digest: find products flagged new / on-sale that were created
 * or updated since the last successful send, and — if any — email every active
 * subscriber via Resend, then advance the `last_digest_sent_at` cutoff.
 *
 * Skips (without advancing the cutoff) when there is nothing to send, no
 * subscribers, or Resend is not configured — so a backlog is delivered once the
 * missing piece is in place rather than being silently dropped. Idempotent
 * enough for daily cron: the cutoff guarantees an item is sent at most once
 * (unless it is edited again afterwards).
 */
export async function runDigest(): Promise<DigestResult> {
  const admin = getAdmin();
  if (!admin) return { ok: false, reason: "server_misconfigured" };

  // Cutoff for "sent this run" is captured up front so products created during
  // the run are picked up next time rather than skipped.
  const runStartedAt = new Date().toISOString();

  // ---- 1. read the last-send cutoff -----------------------------------------
  const { data: state, error: stateErr } = await admin
    .from("digest_state")
    .select("last_digest_sent_at")
    .eq("id", true)
    .maybeSingle();

  if (stateErr) return { ok: false, reason: "state_read_failed" };

  const lastSent: string | undefined = state?.last_digest_sent_at;
  if (!lastSent) {
    // Fresh install (no seed row): initialise the cutoff and skip this run so we
    // never blast the entire back-catalogue on first execution.
    await admin
      .from("digest_state")
      .upsert({ id: true, last_digest_sent_at: runStartedAt });
    return { ok: true, skipped: true, reason: "state_initialised" };
  }

  // ---- 2. qualifying products -----------------------------------------------
  // Flag filter (new OR has a compare-at price) is pushed to the DB; the
  // recency filter is applied in JS to avoid quoting ISO timestamps into an
  // or() string.
  const { data: candidates, error: prodErr } = await admin
    .from("products")
    .select("*")
    .or("is_new.eq.true,compare_at_bgn.not.is.null")
    .order("created_at", { ascending: false });

  if (prodErr) return { ok: false, reason: "products_read_failed" };

  const lastSentMs = new Date(lastSent).getTime();
  const qualifying = ((candidates ?? []) as Product[]).filter((p) => {
    const created = new Date(p.created_at).getTime();
    const updated = p.updated_at ? new Date(p.updated_at).getTime() : created;
    return created > lastSentMs || updated > lastSentMs;
  });

  if (qualifying.length === 0) {
    return { ok: true, skipped: true, reason: "no_qualifying_products", qualifyingProducts: 0 };
  }

  // ---- 3. active subscribers -------------------------------------------------
  const { data: subs, error: subErr } = await admin
    .from("newsletter_subscribers")
    .select("email, unsubscribe_token")
    .is("unsubscribed_at", null);

  if (subErr) return { ok: false, reason: "subscribers_read_failed" };

  const recipients = (subs ?? []).filter(
    (s): s is { email: string; unsubscribe_token: string } =>
      Boolean(s.email && s.unsubscribe_token),
  );

  if (recipients.length === 0) {
    // Don't advance the cutoff: these products should reach the first person who
    // subscribes, rather than being marked "sent" to nobody.
    return {
      ok: true,
      skipped: true,
      reason: "no_subscribers",
      qualifyingProducts: qualifying.length,
      recipients: 0,
    };
  }

  // ---- 4. send ---------------------------------------------------------------
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // Same rationale as above: leave the cutoff so the digest goes out once
    // Resend is configured.
    return {
      ok: false,
      reason: "resend_not_configured",
      qualifyingProducts: qualifying.length,
      recipients: recipients.length,
    };
  }

  const from = process.env.RESEND_FROM || "Noem Studio <onboarding@resend.dev>";
  const digestProducts = qualifying.map(toDigestProduct);
  const resend = new Resend(apiKey);

  const payloads = recipients.map((s) => {
    const unsubscribeUrl = `${SITE_URL}/otpisvane?token=${s.unsubscribe_token}`;
    const { subject, html, text } = renderNewsletterDigestEmail({
      products: digestProducts,
      siteUrl: SITE_URL,
      unsubscribeUrl,
    });
    return {
      from,
      to: s.email,
      subject,
      html,
      text,
      // RFC 8058: surfaces a native "Unsubscribe" affordance in Gmail/Apple Mail
      // and improves deliverability. Points at the GET landing page.
      headers: { "List-Unsubscribe": `<${unsubscribeUrl}>` },
    };
  });

  let sent = 0;
  let failed = 0;

  for (let i = 0; i < payloads.length; i += BATCH_SIZE) {
    const batch = payloads.slice(i, i + BATCH_SIZE);
    try {
      const { data, error } = await resend.batch.send(batch);
      if (error) {
        failed += batch.length;
        continue;
      }
      sent += data?.data?.length ?? batch.length;
    } catch {
      failed += batch.length;
    }
  }

  // ---- 5. advance the cutoff (only if something actually went out) -----------
  if (sent > 0) {
    await admin
      .from("digest_state")
      .update({ last_digest_sent_at: runStartedAt })
      .eq("id", true);
  }

  return {
    ok: sent > 0,
    reason: sent > 0 ? undefined : "send_failed",
    qualifyingProducts: qualifying.length,
    recipients: recipients.length,
    sent,
    failed,
  };
}
