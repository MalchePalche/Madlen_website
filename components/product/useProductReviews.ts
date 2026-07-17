"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * ASSUMED reviews API contract (Agent 1 owns the backend at /api/reviews).
 * As of writing, that route is not yet in the tree, so this UI is built against
 * the shape below. `normalize()` is deliberately tolerant of common field-name
 * variants so a minor mismatch won't break the page — reconcile here if the
 * real response differs.
 *
 *   GET /api/reviews?product_id=<uuid>
 *     → 200 { reviews: Review[], average: number, count: number }
 *       Review = { id, author_name, rating (1-5), comment, created_at (ISO) }
 *       (only APPROVED reviews are returned)
 *
 *   POST /api/reviews   (see submitReview below)
 *     body { product_id, author_name, rating, comment }
 *     → 200/201 { ok: true }   (review stored as pending, awaiting approval)
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** Bulgarian counted form: "1 отзив", "18 отзива". */
export function reviewWord(count: number): string {
  return count === 1 ? "отзив" : "отзива";
}

export interface Review {
  id: string;
  author_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface ReviewsData {
  reviews: Review[];
  average: number;
  count: number;
}

type Raw = Record<string, unknown>;

const str = (...vals: unknown[]): string => {
  for (const v of vals) if (typeof v === "string" && v.trim()) return v;
  return "";
};
const num = (...vals: unknown[]): number => {
  for (const v of vals) {
    const n = typeof v === "number" ? v : typeof v === "string" ? parseFloat(v) : NaN;
    if (Number.isFinite(n)) return n;
  }
  return 0;
};

/** Coerce one raw review object into our shape, tolerating field-name variants. */
function normalizeReview(r: Raw, idx: number): Review {
  return {
    id: str(r.id, r.review_id, r.uuid) || `review-${idx}`,
    author_name: str(r.author_name, r.name, r.author, r.reviewer, r.reviewer_name) || "Анонимен",
    rating: Math.max(0, Math.min(5, Math.round(num(r.rating, r.stars, r.score)))),
    comment: str(r.comment, r.body, r.text, r.message, r.content),
    created_at: str(r.created_at, r.createdAt, r.date, r.inserted_at) || new Date().toISOString(),
  };
}

/** Normalise a raw GET response into ReviewsData (computing avg/count if absent). */
export function normalize(raw: unknown): ReviewsData {
  const root = (raw ?? {}) as Raw;
  const list = Array.isArray(root.reviews)
    ? root.reviews
    : Array.isArray(root.data)
      ? (root.data as unknown[])
      : Array.isArray(raw)
        ? (raw as unknown[])
        : [];

  const reviews = list
    .map((r, i) => normalizeReview((r ?? {}) as Raw, i))
    // Newest first, regardless of server order.
    .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));

  const count = Math.round(num(root.count, root.total, root.reviews_count)) || reviews.length;
  const average =
    num(root.average, root.average_rating, root.avg, root.rating_avg) ||
    (reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0);

  return { reviews, average, count };
}

// Dedupe concurrent loads (the summary near the title and the list further down
// both read the same product), keyed by product id. Cleared on failure so a
// later mount can retry, and bumpable so a fresh submit can re-fetch.
const cache = new Map<string, Promise<ReviewsData>>();

function load(productId: string): Promise<ReviewsData> {
  const cached = cache.get(productId);
  if (cached) return cached;

  const p = fetch(`/api/reviews?product_id=${encodeURIComponent(productId)}`, {
    headers: { Accept: "application/json" },
  }).then(async (res) => {
    if (!res.ok) throw new Error(`reviews request failed: ${res.status}`);
    return normalize(await res.json());
  });

  p.catch(() => cache.delete(productId));
  cache.set(productId, p);
  return p;
}

export interface UseProductReviews {
  data: ReviewsData | null;
  loading: boolean;
  error: boolean;
  reload: () => void;
}

/** Fetch approved reviews + aggregate for a product. Shares one request across mounts. */
export function useProductReviews(productId: string): UseProductReviews {
  const [state, setState] = useState<{ data: ReviewsData | null; loading: boolean; error: boolean }>({
    data: null,
    loading: true,
    error: false,
  });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let active = true;
    setState({ data: null, loading: true, error: false });
    load(productId).then(
      (data) => active && setState({ data, loading: false, error: false }),
      () => active && setState({ data: null, loading: false, error: true }),
    );
    return () => {
      active = false;
    };
  }, [productId, nonce]);

  const reload = useCallback(() => {
    cache.delete(productId);
    setNonce((n) => n + 1);
  }, [productId]);

  return { ...state, reload };
}

export interface SubmitReviewInput {
  productId: string;
  authorName: string;
  rating: number;
  comment: string;
}

/**
 * POST a new review. Resolves on success; on failure throws an Error whose
 * message is the server's (Bulgarian) error text when available, so callers can
 * surface e.g. the rate-limit message directly.
 */
export async function submitReview(input: SubmitReviewInput): Promise<void> {
  const res = await fetch("/api/reviews", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      product_id: input.productId,
      author_name: input.authorName,
      rating: input.rating,
      comment: input.comment,
    }),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error || `review submission failed: ${res.status}`);
  }
}
