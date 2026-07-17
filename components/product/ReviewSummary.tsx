"use client";

import { StarRating } from "./StarRating";
import { useProductReviews, reviewWord } from "./useProductReviews";

/**
 * Compact rating summary shown near the product title/price. Scrolls to the
 * full reviews section (#reviews) on click. Renders nothing on error so a
 * failed fetch never clutters the buy panel; shows a subtle prompt when there
 * are no reviews yet.
 */
export function ReviewSummary({ productId }: { productId: string }) {
  const { data, loading, error } = useProductReviews(productId);

  const scrollToReviews = () => {
    document.getElementById("reviews")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (loading) {
    // Reserve height to avoid a layout shift when the rating arrives.
    return <div className="mt-3 h-5" aria-hidden />;
  }
  if (error) return null;

  const count = data?.count ?? 0;
  const average = data?.average ?? 0;

  if (count === 0) {
    return (
      <button
        type="button"
        onClick={scrollToReviews}
        className="mt-3 text-[0.8rem] text-ash underline-offset-4 hover:text-ink hover:underline"
      >
        Все още няма отзиви — напишете първия
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={scrollToReviews}
      aria-label={`Оценка ${average.toFixed(1)} от 5 от ${count} ${reviewWord(count)}. Към отзивите.`}
      className="group mt-3 inline-flex items-center gap-2 text-sm"
    >
      <StarRating value={average} />
      <span className="font-medium tabular-nums text-ink">{average.toFixed(1)}</span>
      <span className="text-ash underline-offset-4 group-hover:text-ink group-hover:underline">
        ({count} {reviewWord(count)})
      </span>
    </button>
  );
}
