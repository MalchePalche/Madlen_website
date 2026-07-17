"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Read-only star rating. Renders five stars with a precise partial fill for
 * fractional values (e.g. 4.2 → the 5th star is ~20% filled) by overlaying a
 * clipped row of filled stars on a row of outlines.
 */
export function StarRating({
  value,
  className,
  starClassName = "h-4 w-4",
}: {
  value: number;
  className?: string;
  starClassName?: string;
}) {
  const clamped = Math.max(0, Math.min(5, value));
  const pct = (clamped / 5) * 100;

  return (
    <span
      className={cn("relative inline-flex align-middle", className)}
      role="img"
      aria-label={`${clamped.toFixed(1)} от 5 звезди`}
    >
      {/* outline layer */}
      <span aria-hidden className="flex text-ash">
        {[0, 1, 2, 3, 4].map((i) => (
          <Star key={i} className={starClassName} strokeWidth={1.5} />
        ))}
      </span>
      {/* filled layer, clipped to the rating percentage */}
      <span
        aria-hidden
        className="absolute inset-0 flex overflow-hidden text-ink"
        style={{ width: `${pct}%` }}
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <Star key={i} className={cn(starClassName, "shrink-0")} strokeWidth={1.5} fill="currentColor" />
        ))}
      </span>
    </span>
  );
}

/**
 * Interactive 1–5 star picker for the review form. Keyboard + screen-reader
 * friendly (radiogroup semantics); hovering previews the rating.
 */
export function StarPicker({
  value,
  onChange,
  error,
}: {
  value: number;
  onChange: (v: number) => void;
  error?: boolean;
}) {
  const [hover, setHover] = useState(0);
  const active = hover || value;

  return (
    <div
      role="radiogroup"
      aria-label="Оценка от 1 до 5 звезди"
      aria-invalid={error || undefined}
      className="inline-flex gap-1"
      onMouseLeave={() => setHover(0)}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} ${n === 1 ? "звезда" : "звезди"}`}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onFocus={() => setHover(n)}
          onBlur={() => setHover(0)}
          className="p-0.5 text-ink transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
        >
          <Star
            className="h-7 w-7"
            strokeWidth={1.5}
            fill={n <= active ? "currentColor" : "none"}
            color={n <= active ? "currentColor" : "#8a8782"}
          />
        </button>
      ))}
    </div>
  );
}
