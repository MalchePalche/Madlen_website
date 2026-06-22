import { NextResponse } from "next/server";
import { Resend } from "resend";
import { renderOrderConfirmationEmail, type OrderEmailData } from "@/lib/email/order-confirmation";

export const runtime = "nodejs";

/**
 * Sends an order-confirmation email via Resend. Called from checkout after the
 * order is inserted. Degrades gracefully: skips (200) when the customer left no
 * email or when RESEND_API_KEY is not configured, so checkout never breaks.
 */
export async function POST(req: Request) {
  let body: OrderEmailData;
  try {
    body = (await req.json()) as OrderEmailData;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body?.id || !Array.isArray(body.items) || !body.delivery_address) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
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
