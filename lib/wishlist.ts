/**
 * Client-side wishlist backed by localStorage. Stores an array of product slugs
 * under `noem-wishlist`. All reads/writes are SSR-safe (no-op on the server) and
 * tolerant of malformed storage. Mutations dispatch a `WISHLIST_EVENT` so heart
 * icons and the wishlist page stay in sync within the same tab (the native
 * `storage` event only fires in *other* tabs).
 */

const KEY = "noem-wishlist";

/** Fired on the window whenever the wishlist changes in this tab. */
export const WISHLIST_EVENT = "noem-wishlist-change";

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === "string") : [];
  } catch {
    return [];
  }
}

function write(slugs: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(slugs));
    window.dispatchEvent(new Event(WISHLIST_EVENT));
  } catch {
    /* storage unavailable (private mode / quota) — degrade silently */
  }
}

/** All wishlisted product slugs, in the order they were added. */
export function getWishlist(): string[] {
  return read();
}

export function isInWishlist(slug: string): boolean {
  return read().includes(slug);
}

export function addToWishlist(slug: string): void {
  const list = read();
  if (!list.includes(slug)) write([...list, slug]);
}

export function removeFromWishlist(slug: string): void {
  write(read().filter((s) => s !== slug));
}

/** Toggle a slug; returns the new membership state (true = now wishlisted). */
export function toggleWishlist(slug: string): boolean {
  const list = read();
  if (list.includes(slug)) {
    write(list.filter((s) => s !== slug));
    return false;
  }
  write([...list, slug]);
  return true;
}
