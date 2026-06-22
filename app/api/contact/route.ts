import { NextResponse } from "next/server";
import { Resend } from "resend";
import { BRAND } from "@/lib/config";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function esc(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Receives a contact-form submission and emails it to the store via Resend.
 * Degrades gracefully: if RESEND_API_KEY is unset, it logs the message and
 * returns 200 (so the form still confirms success in development).
 */
export async function POST(req: Request) {
  let body: { name?: string; email?: string; phone?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const name = body.name?.trim();
  const email = body.email?.trim();
  const phone = body.phone?.trim();
  const message = body.message?.trim();

  if (!name || !email || !EMAIL_RE.test(email) || !message) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log("[contact] RESEND_API_KEY not set — message not emailed:", {
      name,
      email,
      phone,
      message,
    });
    return NextResponse.json({ ok: true, skipped: true });
  }

  const from = process.env.RESEND_FROM || "Noem Studio <onboarding@resend.dev>";
  const html = `
    <div style="font:400 14px/1.6 Arial,Helvetica,sans-serif;color:#0d0d0d;">
      <p><strong>Ново запитване от формата за контакт</strong></p>
      <p>Име: ${esc(name)}<br>Имейл: ${esc(email)}${phone ? `<br>Телефон: ${esc(phone)}` : ""}</p>
      <p style="white-space:pre-wrap;border-top:1px solid #e3e1dc;padding-top:12px;">${esc(message)}</p>
    </div>`;
  const text = `Ново запитване от ${name} (${email})${phone ? `, тел. ${phone}` : ""}\n\n${message}`;

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to: BRAND.email,
      replyTo: email,
      subject: `Запитване от ${name}`,
      html,
      text,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 502 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "send_failed" }, { status: 502 });
  }
}
