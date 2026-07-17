import { BRAND } from "@/lib/config";
import { formatEUR } from "@/lib/utils";
import { PAPER, INK, ASH, LINE, PANEL, SERIF, SANS, esc, labelStyle } from "./theme";

/** The slice of a product the digest email needs. */
export interface DigestProduct {
  slug: string;
  name_bg: string;
  price_bgn: number;
  compare_at_bgn?: number | null;
  /** Primary image URL, or null when the product has none. */
  image: string | null;
  is_new: boolean;
}

export interface DigestEmailInput {
  products: DigestProduct[];
  /** Absolute storefront base, e.g. "https://noem-studio.com" (no trailing slash). */
  siteUrl: string;
  /** Per-subscriber unsubscribe link. */
  unsubscribeUrl: string;
}

/** True when compare_at is a genuine higher original price (a real discount). */
function onSale(p: DigestProduct): boolean {
  return p.compare_at_bgn != null && p.compare_at_bgn > p.price_bgn;
}

function discountPct(p: DigestProduct): number {
  return Math.round((1 - p.price_bgn / (p.compare_at_bgn as number)) * 100);
}

/**
 * Build subject + HTML + plain-text for the daily newsletter digest (Bulgarian).
 * Lists each qualifying product with image, name, price (+ strike-through
 * compare-at when on sale), each linking to its PDP. Reuses the order-email
 * branding via ./theme so both emails read as one house style.
 */
export function renderNewsletterDigestEmail(input: DigestEmailInput): {
  subject: string;
  html: string;
  text: string;
} {
  const { products, siteUrl, unsubscribeUrl } = input;
  const pdp = (slug: string) => `${siteUrl}/produkt/${slug}`;

  const newCount = products.filter((p) => p.is_new).length;
  const saleCount = products.filter(onSale).length;

  const subject =
    newCount && saleCount
      ? `Ново и промоции в ${BRAND.name}`
      : saleCount && !newCount
        ? `Промоции в ${BRAND.name}`
        : `Ново в ${BRAND.name}`;

  const preheader =
    products.length === 1
      ? esc(products[0].name_bg)
      : `${products.length} нови попълнения и промоции`;

  // ---- product rows ----------------------------------------------------------
  const cards = products
    .map((p) => {
      const url = esc(pdp(p.slug));
      const sale = onSale(p);
      const img = p.image
        ? `<a href="${url}" style="text-decoration:none;">
             <img src="${esc(p.image)}" width="120" height="150" alt="${esc(p.name_bg)}"
                  style="display:block;width:120px;height:150px;object-fit:cover;border:1px solid ${LINE};background:${PANEL};" />
           </a>`
        : `<a href="${url}" style="display:block;width:120px;height:150px;border:1px solid ${LINE};background:${PANEL};text-decoration:none;"></a>`;

      const badge = (bg: string, color: string, txt: string) =>
        `<span style="display:inline-block;margin:0 6px 6px 0;padding:3px 7px;font:600 10px/1 ${SANS};letter-spacing:1px;text-transform:uppercase;background:${bg};color:${color};">${txt}</span>`;

      const badges =
        (p.is_new ? badge(INK, PAPER, "Ново") : "") +
        (sale ? badge("#b23b2e", "#ffffff", `-${discountPct(p)}%`) : "");

      const price = sale
        ? `<span style="font:700 16px/1 ${SANS};color:${INK};">${esc(formatEUR(p.price_bgn))}</span>
           <span style="margin-left:8px;font:400 13px/1 ${SANS};color:${ASH};text-decoration:line-through;">${esc(formatEUR(p.compare_at_bgn as number))}</span>`
        : `<span style="font:700 16px/1 ${SANS};color:${INK};">${esc(formatEUR(p.price_bgn))}</span>`;

      return `
      <tr>
        <td width="132" valign="top" style="padding:0 16px 26px 0;">${img}</td>
        <td valign="top" style="padding:0 0 26px 0;">
          <a href="${url}" style="text-decoration:none;color:${INK};">
            <span style="font:400 18px/1.25 ${SERIF};color:${INK};">${esc(p.name_bg)}</span>
          </a>
          <div style="margin-top:8px;">${badges || ""}</div>
          <div style="margin-top:${badges ? "2px" : "8px"};">${price}</div>
          <div style="margin-top:12px;">
            <a href="${url}" style="font:600 11px/1 ${SANS};letter-spacing:1.4px;text-transform:uppercase;color:${INK};text-decoration:none;border-bottom:1px solid ${INK};padding-bottom:3px;">Разгледай</a>
          </div>
        </td>
      </tr>`;
    })
    .join("");

  const html = `<!doctype html>
<html lang="bg"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:${PAPER};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER};">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:560px;max-width:100%;background:${PAPER};">
        <!-- wordmark -->
        <tr><td style="padding-bottom:24px;border-bottom:1px solid ${LINE};text-align:center;">
          <span style="font:400 22px/1 ${SERIF};letter-spacing:6px;color:${INK};">${esc(BRAND.name)}</span>
        </td></tr>

        <!-- heading -->
        <tr><td style="padding:32px 0 4px;">
          <div style="${labelStyle()}">${esc(BRAND.season)}</div>
          <h1 style="margin:10px 0 0;font:400 28px/1.15 ${SERIF};color:${INK};">Ново при нас</h1>
          <p style="margin:14px 0 0;font:400 14px/1.6 ${SANS};color:${ASH};">
            Подбрани нови продукти и актуални промоции. Разгледайте и открийте своя фаворит.
          </p>
        </td></tr>

        <!-- products -->
        <tr><td style="padding:28px 0 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${cards}</table>
        </td></tr>

        <!-- CTA -->
        <tr><td style="padding:6px 0 0;">
          <a href="${esc(siteUrl)}/novo" style="display:inline-block;background:${INK};color:${PAPER};font:600 12px/1 ${SANS};letter-spacing:1.4px;text-transform:uppercase;text-decoration:none;padding:14px 26px;">Виж всички новости</a>
        </td></tr>

        <!-- footer -->
        <tr><td style="padding:36px 0 0;border-top:1px solid ${LINE};margin-top:36px;">
          <p style="margin:24px 0 0;font:400 12px/1.6 ${SANS};color:${ASH};text-align:center;">
            Получавате този имейл, защото се абонирахте за новини от ${esc(BRAND.name)}.<br>
            <a href="${esc(unsubscribeUrl)}" style="color:${ASH};text-decoration:underline;">Отписване от бюлетина</a>
            &nbsp;·&nbsp;
            <a href="mailto:${esc(BRAND.email)}" style="color:${ASH};text-decoration:underline;">${esc(BRAND.email)}</a><br>
            © ${new Date().getFullYear()} ${esc(BRAND.name)}
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const text = [
    `${BRAND.name} — ново при нас`,
    ``,
    `Подбрани нови продукти и актуални промоции:`,
    ``,
    ...products.map((p) => {
      const priceStr = onSale(p)
        ? `${formatEUR(p.price_bgn)} (беше ${formatEUR(p.compare_at_bgn as number)})`
        : formatEUR(p.price_bgn);
      const tags = [p.is_new ? "Ново" : "", onSale(p) ? `-${discountPct(p)}%` : ""]
        .filter(Boolean)
        .join(", ");
      return `- ${p.name_bg}${tags ? ` [${tags}]` : ""} — ${priceStr}\n  ${pdp(p.slug)}`;
    }),
    ``,
    `Виж всички новости: ${siteUrl}/novo`,
    ``,
    `—`,
    `Отписване от бюлетина: ${unsubscribeUrl}`,
    `Въпроси? ${BRAND.email}`,
  ].join("\n");

  return { subject, html, text };
}
