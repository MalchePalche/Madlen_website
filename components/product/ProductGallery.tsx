"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Image gallery: a scroll-snap carousel (native swipe on mobile) paired with a
 * thumbnail strip. Active slide is tracked via IntersectionObserver so the
 * counter + active thumbnail stay in sync whether the user swipes or clicks.
 */
export function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const multiple = images.length > 1;

  useEffect(() => {
    const track = trackRef.current;
    if (!track || !multiple) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.index));
        });
      },
      { root: track, threshold: 0.6 },
    );
    slideRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [multiple, images.length]);

  const goTo = (i: number) =>
    slideRefs.current[i]?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });

  return (
    <div
      className={cn(
        "grid gap-3 lg:gap-4",
        // Only reserve the 84px thumbnail column when there are thumbnails to
        // show. With a single image the strip is hidden, so a two-column grid
        // would squeeze the main image into the 84px slot and leave the rest
        // of the gallery empty — fall back to a single full-width column.
        multiple ? "lg:grid-cols-[84px_1fr]" : "lg:grid-cols-1",
      )}
    >
      {/* thumbnails */}
      {multiple && (
        <div className="order-2 flex gap-3 overflow-x-auto pb-1 lg:order-1 lg:flex-col lg:overflow-visible lg:pb-0 [&::-webkit-scrollbar]:hidden">
          {images.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Покажи изображение ${i + 1}`}
              aria-current={active === i}
              className={cn(
                "relative aspect-[3/4] w-16 shrink-0 overflow-hidden bg-mist transition-opacity lg:w-full",
                active === i ? "opacity-100 ring-1 ring-ink" : "opacity-55 hover:opacity-100",
              )}
            >
              <Image src={src} alt="" fill sizes="84px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* main carousel */}
      <div className="relative order-1 lg:order-2">
        <div
          ref={trackRef}
          className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {images.map((src, i) => (
            <div
              key={src + i}
              data-index={i}
              ref={(el) => {
                slideRefs.current[i] = el;
              }}
              className="relative aspect-[3/4] w-full shrink-0 snap-center bg-mist"
            >
              <Image
                src={src}
                alt={`${alt} — снимка ${i + 1}`}
                fill
                priority={i === 0}
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>

        {multiple && (
          <span className="pointer-events-none absolute right-3 top-3 bg-paper/90 px-2 py-1 text-[0.62rem] tabular-nums tracking-widest2">
            {active + 1} / {images.length}
          </span>
        )}
      </div>
    </div>
  );
}
