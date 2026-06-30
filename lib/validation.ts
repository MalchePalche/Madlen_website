/** Shared form validation primitives (used by checkout + auth forms). */

export const cleanPhone = (v: string) => v.replace(/[\s\-()]/g, "");

export const PHONE_RE = /^(\+359|0)\d{9}$/; // BG: +359XXXXXXXXX or 0XXXXXXXXX
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const POSTCODE_RE = /^\d{4}$/; // BG postcode = 4 digits

export const isPhone = (v: string) => PHONE_RE.test(cleanPhone(v));
export const isEmail = (v: string) => EMAIL_RE.test(v.trim());
export const isPostcode = (v: string) => POSTCODE_RE.test(v.trim());

/** Character-level phone guard: digits, spaces, dashes, plus only (6–20 chars). */
export const PHONE_INPUT_RE = /^[0-9\s\-\+]{6,20}$/;

/** Strip HTML tags (defence-in-depth against stored XSS in free-text fields). */
export const stripTags = (v: string) => v.replace(/<[^>]*>/g, "");

/** Trim whitespace + strip HTML tags — apply to any string field before persisting. */
export const sanitizeText = (v: string) => stripTags(v.trim());
