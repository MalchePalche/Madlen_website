import { BRAND } from "@/lib/config";
import { formatEUR } from "@/lib/utils";
import { PAPER, INK, ASH, LINE, esc } from "./theme";
import type { CartItem, DeliveryAddress } from "@/lib/types";

export interface OrderEmailData {
  id: string;
  items: CartItem[];
  subtotal: number;
  delivery: number;
  total_bgn: number;
  delivery_address: DeliveryAddress;
}

/** Build subject + HTML + plain-text for an order confirmation email (Bulgarian). */
export function renderOrderConfirmationEmail(o: OrderEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const shortId = o.id.slice(0, 8).toUpperCase();
  const a = o.delivery_address;
  const subject = `Потвърждение на поръчка #${shortId} — ${BRAND.name}`;

  const label = (t: string) =>
    `font:600 11px/1 Arial,Helvetica,sans-serif;letter-spacing:1.6px;text-transform:uppercase;color:${ASH};`;

  const itemRows = o.items
    .map(
      (i) => `
      <tr>
        <td style="padding:14px 0;border-bottom:1px solid ${LINE};font:400 14px/1.4 Arial,Helvetica,sans-serif;color:${INK};">
          ${esc(i.name_bg)}
          <div style="margin-top:3px;font-size:12px;color:${ASH};">${esc(i.color)} · Размер ${esc(i.size)} · ${i.quantity} бр.</div>
        </td>
        <td style="padding:14px 0;border-bottom:1px solid ${LINE};font:400 14px/1.4 Arial,Helvetica,sans-serif;color:${INK};text-align:right;white-space:nowrap;">
          ${esc(formatEUR(i.price_bgn * i.quantity))}
        </td>
      </tr>`,
    )
    .join("");

  const totalRow = (
    name: string,
    value: string,
    opts: { bold?: boolean; top?: boolean } = {},
  ) => `
    <tr>
      <td style="padding:6px 0;${opts.top ? `padding-top:12px;border-top:1px solid ${LINE};` : ""}font:${opts.bold ? "700" : "400"} ${opts.bold ? "16" : "14"}px/1.4 Arial,Helvetica,sans-serif;color:${INK};">${name}</td>
      <td style="padding:6px 0;${opts.top ? `padding-top:12px;border-top:1px solid ${LINE};` : ""}font:${opts.bold ? "700" : "400"} ${opts.bold ? "16" : "14"}px/1.4 Arial,Helvetica,sans-serif;color:${INK};text-align:right;white-space:nowrap;">${value}</td>
    </tr>`;

  const html = `<!doctype html>
<html lang="bg"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:${PAPER};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER};">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:560px;max-width:100%;background:${PAPER};">
        <!-- wordmark -->
        <tr><td style="padding-bottom:24px;border-bottom:1px solid ${LINE};text-align:center;">
          <span style="font:400 22px/1 Georgia,'Times New Roman',serif;letter-spacing:6px;color:${INK};">${esc(BRAND.name)}</span>
        </td></tr>

        <!-- heading -->
        <tr><td style="padding:32px 0 0;">
          <div style="${label("")}">Поръчката е приета</div>
          <h1 style="margin:10px 0 0;font:400 28px/1.15 Georgia,'Times New Roman',serif;color:${INK};">Благодарим за поръчката!</h1>
          <p style="margin:14px 0 0;font:400 14px/1.6 Arial,Helvetica,sans-serif;color:${ASH};">
            Здравейте, ${esc(a.first_name)}. Получихме вашата поръчка
            <strong style="color:${INK};">#${esc(shortId)}</strong> и ще се свържем с вас по телефона за потвърждение.
          </p>
        </td></tr>

        <!-- items -->
        <tr><td style="padding:28px 0 0;">
          <div style="${label("")}padding-bottom:6px;">Продукти</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${itemRows}</table>
        </td></tr>

        <!-- totals -->
        <tr><td style="padding:18px 0 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${totalRow("Междинна сума", esc(formatEUR(o.subtotal)))}
            ${totalRow("Доставка", o.delivery === 0 ? "Безплатна" : esc(formatEUR(o.delivery)))}
            ${totalRow("Общо", esc(formatEUR(o.total_bgn)), { bold: true, top: true })}
          </table>
        </td></tr>

        <!-- COD note -->
        <tr><td style="padding:24px 0 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1efea;">
            <tr><td style="padding:16px 18px;font:400 13px/1.5 Arial,Helvetica,sans-serif;color:${INK};">
              <strong>Плащане: Наложен платеж</strong><br>
              Плащате в брой на куриера при доставка. Не е необходимо онлайн плащане.
            </td></tr>
          </table>
        </td></tr>

        <!-- delivery address -->
        <tr><td style="padding:24px 0 0;">
          <div style="${label("")}padding-bottom:8px;">Доставка до</div>
          <p style="margin:0;font:400 14px/1.6 Arial,Helvetica,sans-serif;color:${INK};">
            ${esc(a.first_name)} ${esc(a.last_name)}<br>
            ${esc(a.address)}<br>
            ${esc(a.postcode)} ${esc(a.city)}<br>
            <span style="color:${ASH};">${esc(a.phone)}</span>
          </p>
        </td></tr>

        <!-- footer -->
        <tr><td style="padding:32px 0 0;margin-top:32px;border-top:1px solid ${LINE};">
          <p style="margin:24px 0 0;font:400 12px/1.6 Arial,Helvetica,sans-serif;color:${ASH};text-align:center;">
            Въпроси? Пишете ни на
            <a href="mailto:${esc(BRAND.email)}" style="color:${INK};">${esc(BRAND.email)}</a>
            или ${esc(BRAND.phone)}.<br>
            © ${new Date().getFullYear()} ${esc(BRAND.name)}
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const text = [
    `${BRAND.name} — потвърждение на поръчка #${shortId}`,
    ``,
    `Здравейте, ${a.first_name}. Получихме вашата поръчка.`,
    ``,
    `Продукти:`,
    ...o.items.map(
      (i) => `- ${i.name_bg} (${i.color}, размер ${i.size}) x${i.quantity} — ${formatEUR(i.price_bgn * i.quantity)}`,
    ),
    ``,
    `Междинна сума: ${formatEUR(o.subtotal)}`,
    `Доставка: ${o.delivery === 0 ? "Безплатна" : formatEUR(o.delivery)}`,
    `Общо: ${formatEUR(o.total_bgn)}`,
    ``,
    `Плащане: Наложен платеж (в брой при доставка).`,
    ``,
    `Доставка до:`,
    `${a.first_name} ${a.last_name}`,
    `${a.address}`,
    `${a.postcode} ${a.city}`,
    `${a.phone}`,
    ``,
    `Въпроси? ${BRAND.email} · ${BRAND.phone}`,
  ].join("\n");

  return { subject, html, text };
}
