"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  Trash2,
  Loader2,
  AlertCircle,
  MessageSquareOff,
  ExternalLink,
} from "lucide-react";
import { StarRating } from "@/components/product/StarRating";
import { cn } from "@/lib/utils";

export type ReviewStatus = "pending" | "approved" | "all";

export interface AdminReview {
  id: string;
  product_id: string;
  product_name: string | null;
  product_slug: string | null;
  author_name: string;
  rating: number;
  comment: string | null;
  is_approved: boolean;
  created_at: string;
}

interface Counts {
  pending: number;
  approved: number;
  total: number;
}

const TABS: { value: ReviewStatus; label: string }[] = [
  { value: "pending", label: "Чакащи" },
  { value: "approved", label: "Одобрени" },
  { value: "all", label: "Всички" },
];

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("bg-BG", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ReviewModeration({
  reviews,
  counts,
  status,
}: {
  reviews: AdminReview[];
  counts: Counts;
  status: ReviewStatus;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmReject, setConfirmReject] = useState<AdminReview | null>(null);
  const [isPending, startTransition] = useTransition();

  const tabCount = (t: ReviewStatus) =>
    t === "pending" ? counts.pending : t === "approved" ? counts.approved : counts.total;

  async function moderate(review: AdminReview, action: "approve" | "reject") {
    setBusyId(review.id);
    setError(null);
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: review.id, action }),
      });
      if (!res.ok) throw new Error();
      setConfirmReject(null);
      // Re-fetch the server component: refreshes the list, tab counts, and the
      // pending badge in the admin nav (the layout re-runs on refresh).
      startTransition(() => router.refresh());
    } catch {
      setError("Грешка при обработката. Опитайте отново.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      {/* ---- Tabs ---- */}
      <div
        role="tablist"
        aria-label="Филтър по статус"
        className="flex flex-wrap gap-2 border-b border-hairline pb-4"
      >
        {TABS.map((t) => {
          const active = t.value === status;
          return (
            <Link
              key={t.value}
              href={`/admin/otzivi?status=${t.value}`}
              role="tab"
              aria-selected={active}
              className={cn(
                "inline-flex items-center gap-2 border px-4 py-2 text-[0.72rem] uppercase tracking-widest2 transition-colors",
                active
                  ? "border-noir bg-noir text-paper"
                  : "border-hairline text-ash hover:border-ink hover:text-ink",
              )}
            >
              {t.label}
              <span
                className={cn(
                  "tabular-nums",
                  active ? "text-paper/70" : "text-ash",
                )}
              >
                {tabCount(t.value)}
              </span>
            </Link>
          );
        })}
      </div>

      {error && (
        <p role="alert" className="mt-4 flex items-center gap-2 text-sm text-[#8a2b2b]">
          <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={1.6} /> {error}
        </p>
      )}

      {/* ---- Review cards (same layout mobile + desktop) ---- */}
      {reviews.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-3 border border-hairline bg-paper py-16 text-center">
          <MessageSquareOff className="h-8 w-8 text-ash" strokeWidth={1} />
          <p className="px-6 text-sm text-ash">
            {status === "pending"
              ? "Няма чакащи отзиви за одобрение."
              : status === "approved"
                ? "Все още няма одобрени отзиви."
                : "Все още няма отзиви."}
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {reviews.map((r) => {
            const rowBusy = busyId === r.id || isPending;
            return (
              <li
                key={r.id}
                className="border border-hairline bg-paper p-4 lg:p-5"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
                  {/* left — content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                      <StarRating value={r.rating} />
                      {!r.is_approved ? (
                        <span className="border border-hairline px-2 py-0.5 text-[0.58rem] uppercase tracking-widest2 text-ash">
                          Чака одобрение
                        </span>
                      ) : (
                        <span className="bg-noir px-2 py-0.5 text-[0.58rem] uppercase tracking-widest2 text-paper">
                          Одобрен
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-sm">
                      <span className="font-medium">{r.author_name || "Анонимен"}</span>
                      <span className="text-ash"> · {formatDateTime(r.created_at)}</span>
                    </p>

                    {/* product link */}
                    {r.product_slug ? (
                      <Link
                        href={`/produkt/${r.product_slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1.5 inline-flex items-center gap-1.5 text-[0.8rem] text-ash underline-offset-4 hover:text-ink hover:underline"
                      >
                        {r.product_name ?? "Продукт"}
                        <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.6} />
                      </Link>
                    ) : (
                      <p className="mt-1.5 text-[0.8rem] text-ash">
                        {r.product_name ?? "Изтрит продукт"}
                      </p>
                    )}

                    {r.comment && (
                      <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink">
                        {r.comment}
                      </p>
                    )}
                  </div>

                  {/* right — actions */}
                  <div className="flex shrink-0 items-center gap-2 lg:flex-col lg:items-stretch">
                    {!r.is_approved && (
                      <button
                        type="button"
                        onClick={() => moderate(r, "approve")}
                        disabled={rowBusy}
                        className="inline-flex flex-1 items-center justify-center gap-2 bg-noir px-4 py-2.5 text-[0.72rem] font-semibold uppercase tracking-widest2 text-paper transition-colors hover:bg-ink disabled:opacity-60 lg:flex-none"
                      >
                        {busyId === r.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.8} />
                        ) : (
                          <>
                            <Check className="h-4 w-4" strokeWidth={1.8} /> Одобри
                          </>
                        )}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setConfirmReject(r);
                      }}
                      disabled={rowBusy}
                      className="inline-flex flex-1 items-center justify-center gap-2 border border-hairline px-4 py-2.5 text-[0.72rem] font-semibold uppercase tracking-widest2 text-[#8a2b2b] transition-colors hover:border-[#8a2b2b] hover:bg-[#8a2b2b] hover:text-paper disabled:opacity-60 lg:flex-none"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={1.8} />
                      {r.is_approved ? "Изтрий" : "Отхвърли"}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* ---- Reject/delete confirmation ---- */}
      {confirmReject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-noir/40 p-5"
          role="dialog"
          aria-modal="true"
          onClick={() => busyId === null && setConfirmReject(null)}
        >
          <div
            className="w-full max-w-sm border border-hairline bg-paper p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-display text-2xl">
              {confirmReject.is_approved ? "Изтриване на отзив" : "Отхвърляне на отзив"}
            </h2>
            <p className="mt-3 text-sm text-ash">
              Отзивът от{" "}
              <span className="font-medium text-ink">
                {confirmReject.author_name || "Анонимен"}
              </span>{" "}
              ще бъде изтрит завинаги. Това действие е необратимо.
            </p>

            {error && (
              <p role="alert" className="mt-4 flex items-center gap-2 text-sm text-[#8a2b2b]">
                <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={1.6} /> {error}
              </p>
            )}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmReject(null)}
                disabled={busyId !== null}
                className="btn-outline flex-1 disabled:opacity-60"
              >
                Отказ
              </button>
              <button
                type="button"
                onClick={() => moderate(confirmReject, "reject")}
                disabled={busyId !== null}
                className="inline-flex flex-1 items-center justify-center gap-2 bg-[#8a2b2b] px-8 py-4 text-[0.72rem] font-semibold uppercase tracking-widest2 text-paper transition-colors hover:bg-[#741f1f] disabled:opacity-70"
              >
                {busyId !== null ? (
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.8} />
                ) : (
                  "Изтрий"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
