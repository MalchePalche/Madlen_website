import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PullToRefresh, RefreshButton } from "@/components/admin/PullToRefresh";
import {
  ReviewModeration,
  type AdminReview,
  type ReviewStatus,
} from "@/components/admin/ReviewModeration";

export const metadata: Metadata = { title: "Отзиви — Админ", robots: { index: false } };

// Always show the latest moderation queue — never a cached snapshot.
export const dynamic = "force-dynamic";

const STATUSES: ReviewStatus[] = ["pending", "approved", "all"];

/** Supabase embeds a to-one relation as an object, but its generated types can
 *  widen it to an array — normalise either shape to a single product. */
type ProductRel = { name_bg: string | null; slug: string | null } | null;
function pickProduct(rel: unknown): ProductRel {
  if (Array.isArray(rel)) return (rel[0] as ProductRel) ?? null;
  return (rel as ProductRel) ?? null;
}

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: { status?: string | string[] };
}) {
  // Admin access + Supabase config are enforced by app/admin/layout.tsx.
  const supabase = createClient();

  const raw = Array.isArray(searchParams.status) ? searchParams.status[0] : searchParams.status;
  const status: ReviewStatus = STATUSES.includes(raw as ReviewStatus)
    ? (raw as ReviewStatus)
    : "pending";

  let query = supabase
    .from("reviews")
    .select("id, product_id, author_name, rating, comment, is_approved, created_at, products(name_bg, slug)")
    .order("created_at", { ascending: false });
  if (status === "pending") query = query.eq("is_approved", false);
  else if (status === "approved") query = query.eq("is_approved", true);

  // List + both tab counts (head-only counts are cheap — no rows transferred).
  const [{ data }, { count: pending }, { count: approved }] = await Promise.all([
    query,
    supabase.from("reviews").select("*", { count: "exact", head: true }).eq("is_approved", false),
    supabase.from("reviews").select("*", { count: "exact", head: true }).eq("is_approved", true),
  ]);

  const reviews: AdminReview[] = (data ?? []).map((r) => {
    const product = pickProduct((r as { products?: unknown }).products);
    return {
      id: r.id as string,
      product_id: r.product_id as string,
      product_name: product?.name_bg ?? null,
      product_slug: product?.slug ?? null,
      author_name: r.author_name as string,
      rating: r.rating as number,
      comment: (r.comment as string | null) ?? null,
      is_approved: r.is_approved as boolean,
      created_at: r.created_at as string,
    };
  });

  const counts = {
    pending: pending ?? 0,
    approved: approved ?? 0,
    total: (pending ?? 0) + (approved ?? 0),
  };

  return (
    <PullToRefresh>
      <div className="lg:p-8">
        <header className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-30 flex items-end justify-between gap-3 border-b border-hairline bg-paper px-5 py-4 lg:static lg:px-0 lg:py-0 lg:pb-6">
          <div>
            <p className="eyebrow">
              {counts.pending} {counts.pending === 1 ? "чакащ отзив" : "чакащи отзива"}
            </p>
            <h1 className="mt-1 font-display text-2xl lg:mt-2 lg:text-5xl">Отзиви</h1>
          </div>
          <RefreshButton />
        </header>

        <div className="px-5 pb-6 pt-6 lg:px-0 lg:pb-0 lg:pt-8">
          <ReviewModeration reviews={reviews} counts={counts} status={status} />
        </div>
      </div>
    </PullToRefresh>
  );
}
