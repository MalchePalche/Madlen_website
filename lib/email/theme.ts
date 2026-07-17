/**
 * Shared visual language for Noem Studio transactional/marketing emails.
 * Email clients ignore <style>/CSS variables, so everything is an inline value
 * reused across templates (order confirmation, newsletter digest, …) to keep
 * the branding identical.
 */

// Inline-styled palette (paper background, ink text, ash muted, hairline rules).
export const PAPER = "#faf9f7";
export const INK = "#0d0d0d";
export const ASH = "#8a8782";
export const LINE = "#e3e1dc";
/** Soft panel fill for callout boxes (payment note, etc.). */
export const PANEL = "#f1efea";

export const SERIF = "Georgia,'Times New Roman',serif";
export const SANS = "Arial,Helvetica,sans-serif";

/** Escape user/data-derived text for safe interpolation into email HTML. */
export function esc(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Uppercase micro-label style used above sections. */
export function labelStyle(): string {
  return `font:600 11px/1 ${SANS};letter-spacing:1.6px;text-transform:uppercase;color:${ASH};`;
}
