"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, MessageSquare, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { StarRating, StarPicker } from "./StarRating";
import {
  useProductReviews,
  submitReview,
  reviewWord,
  type Review,
} from "./useProductReviews";

/** "17 юли 2026" — falls back to the raw string if the date can't be parsed. */
function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("bg-BG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

function ReviewItem({ review }: { review: Review }) {
  const date = formatDate(review.created_at);
  return (
    <li className="border-t border-hairline py-6 first:border-t-0">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-medium text-ink">{review.author_name}</p>
          <StarRating value={review.rating} className="mt-1.5" starClassName="h-3.5 w-3.5" />
        </div>
        {date && <time className="shrink-0 text-[0.74rem] text-ash">{date}</time>}
      </div>
      {review.comment && (
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink/80">
          {review.comment}
        </p>
      )}
    </li>
  );
}

function ReviewsSkeleton() {
  return (
    <ul aria-hidden className="animate-pulse">
      {[0, 1, 2].map((i) => (
        <li key={i} className="border-t border-hairline py-6 first:border-t-0">
          <div className="h-4 w-32 rounded bg-hairline" />
          <div className="mt-2 h-3 w-24 rounded bg-hairline" />
          <div className="mt-3 h-3 w-full rounded bg-hairline" />
          <div className="mt-2 h-3 w-4/5 rounded bg-hairline" />
        </li>
      ))}
    </ul>
  );
}

/** The review submission form. Calls onSubmitted() after a successful POST. */
function ReviewForm({ productId }: { productId: string }) {
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [attempted, setAttempted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Name + rating are required; comment is optional (the API stores null when
  // empty), matching the reviews backend.
  const errors = {
    name: name.trim().length < 2 ? "Въведете вашето име" : undefined,
    rating: rating < 1 ? "Изберете оценка" : undefined,
  };
  const invalid = Boolean(errors.name || errors.rating);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttempted(true);
    setError(null);
    if (invalid) return;

    setBusy(true);
    try {
      await submitReview({
        productId,
        authorName: name.trim(),
        rating,
        comment: comment.trim(),
      });
      setSubmitted(true);
    } catch (err) {
      setBusy(false);
      // Surface the server's Bulgarian message (e.g. rate-limit) when present;
      // otherwise fall back to a generic error.
      const msg = err instanceof Error ? err.message : "";
      setError(/[а-яА-Я]/.test(msg) ? msg : "Отзивът не беше изпратен. Моля, опитайте отново по-късно.");
    }
  };

  if (submitted) {
    return (
      <div className="flex items-start gap-3 border border-hairline bg-mist p-6 text-sm">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={1.5} />
        <p className="leading-relaxed">
          <span className="font-medium text-ink">Благодарим за отзива!</span> Изпратено за одобрение
          — ще се появи публично, след като бъде прегледан от нашия екип.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div>
        <span className="block text-[0.74rem] uppercase tracking-widest2 text-ash">
          Вашата оценка <span aria-hidden>*</span>
        </span>
        <div className="mt-2">
          <StarPicker value={rating} onChange={setRating} error={attempted && !!errors.rating} />
        </div>
        {attempted && errors.rating && (
          <p className="mt-1.5 text-[0.74rem] text-[#8a2b2b]">{errors.rating}</p>
        )}
      </div>

      <div>
        <label htmlFor="review-name" className="block text-[0.74rem] uppercase tracking-widest2 text-ash">
          Име <span aria-hidden>*</span>
        </label>
        <input
          id="review-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          maxLength={80}
          aria-invalid={attempted && !!errors.name}
          className={cn(
            "mt-2 w-full border bg-paper px-3.5 py-3 text-sm transition-colors focus:outline-none",
            attempted && errors.name ? "border-[#8a2b2b] focus:border-[#8a2b2b]" : "border-hairline focus:border-ink",
          )}
        />
        {attempted && errors.name && (
          <p className="mt-1.5 text-[0.74rem] text-[#8a2b2b]">{errors.name}</p>
        )}
      </div>

      <div>
        <label htmlFor="review-comment" className="block text-[0.74rem] uppercase tracking-widest2 text-ash">
          Отзив <span className="normal-case tracking-normal">(по избор)</span>
        </label>
        <textarea
          id="review-comment"
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={2000}
          placeholder="Споделете какво мислите за продукта…"
          className="mt-2 w-full resize-none border border-hairline bg-paper px-3.5 py-3 text-sm transition-colors focus:border-ink focus:outline-none"
        />
      </div>

      {error && (
        <p role="alert" className="flex items-center gap-2 text-sm text-[#8a2b2b]">
          <AlertCircle className="h-4 w-4" strokeWidth={1.6} /> {error}
        </p>
      )}

      <button type="submit" disabled={busy} className={cn("btn-noir w-full sm:w-auto", busy && "opacity-70")}>
        {busy ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} /> Изпращане…
          </>
        ) : (
          <>
            <Send className="h-4 w-4" strokeWidth={1.6} /> Изпрати отзив
          </>
        )}
      </button>
      <p className="text-[0.72rem] text-ash">
        Отзивите се публикуват след одобрение от нашия екип.
      </p>
    </form>
  );
}

/**
 * Full reviews section for the PDP: aggregate header, the approved-reviews list
 * (newest first), and a submission form. Handles loading, error and empty
 * states. Data is fetched client-side from /api/reviews (Agent 1's backend);
 * see useProductReviews for the assumed contract.
 */
export function ProductReviews({ productId }: { productId: string }) {
  const { data, loading, error } = useProductReviews(productId);
  const count = data?.count ?? 0;
  const average = data?.average ?? 0;

  return (
    <section id="reviews" className="mt-20 scroll-mt-24 border-t border-hairline pt-12 lg:mt-28">
      <p className="eyebrow">Отзиви</p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <h2 className="font-display text-3xl lg:text-4xl">Мнения на клиенти</h2>
        {!loading && !error && count > 0 && (
          <div className="flex items-center gap-3">
            <span className="font-display text-3xl leading-none text-ink">{average.toFixed(1)}</span>
            <span>
              <StarRating value={average} />
              <span className="mt-0.5 block text-[0.74rem] text-ash">
                {count} {reviewWord(count)}
              </span>
            </span>
          </div>
        )}
      </div>

      <div className="mt-10 grid gap-x-16 gap-y-12 lg:grid-cols-[1fr_minmax(320px,420px)]">
        {/* list */}
        <div className="min-w-0 lg:order-1">
          {loading ? (
            <ReviewsSkeleton />
          ) : error ? (
            <p className="flex items-center gap-2 text-sm text-ash">
              <AlertCircle className="h-4 w-4" strokeWidth={1.6} />
              Отзивите не можаха да се заредят в момента.
            </p>
          ) : count === 0 ? (
            <div className="flex flex-col items-start gap-3 border border-dashed border-hairline p-8 text-sm text-ash">
              <MessageSquare className="h-6 w-6" strokeWidth={1.3} />
              <p>
                Все още няма отзиви за този продукт.
                <br />
                Бъдете първият, който ще сподели мнение.
              </p>
            </div>
          ) : (
            <ul>
              {data!.reviews.map((r) => (
                <ReviewItem key={r.id} review={r} />
              ))}
            </ul>
          )}
        </div>

        {/* form */}
        <div className="lg:order-2 lg:sticky lg:top-24 lg:self-start">
          <h3 className="font-display text-xl">Напишете отзив</h3>
          <p className="mt-1.5 text-sm text-ash">Споделете мнението си с други клиенти.</p>
          <div className="mt-6">
            <ReviewForm productId={productId} />
          </div>
        </div>
      </div>
    </section>
  );
}
