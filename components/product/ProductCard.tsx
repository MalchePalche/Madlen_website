"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Plus, Heart } from "lucide-react";
import type { Product } from "@/lib/types";
import { useCart } from "@/store/cart";
import { formatEUR } from "@/lib/utils";
import { isInWishlist, toggleWishlist, WISHLIST_EVENT } from "@/lib/wishlist";

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const addItem = useCart((s) => s.addItem);
  const primary = product.images[0];
  const secondary = product.images[1] ?? product.images[0];
  const onSale = product.compare_at_bgn && product.compare_at_bgn > product.price_bgn;

  // Availability: sold out when there's no stock, or every size is flagged out
  // of stock. Quick-add is hidden entirely in that case.
  const oosSizes = product.out_of_stock_sizes ?? [];
  const soldOut =
    product.stock <= 0 ||
    (product.sizes.length > 0 && product.sizes.every((s) => oosSizes.includes(s)));
  // Default to the first in-stock size (skipping sold-out ones); sizeless
  // products fall back to "ONE".
  const defaultSize = product.sizes.find((s) => !oosSizes.includes(s)) ?? "ONE";

  // Quick-add uses the first available size + colour; full choice lives on the PDP.
  const quickAdd = () => {
    addItem({
      productId: product.id,
      slug: product.slug,
      name_bg: product.name_bg,
      price_bgn: product.price_bgn,
      image: primary,
      size: defaultSize,
      color: product.colors[0]?.name ?? "—",
      quantity: 1,
    });
  };

  // Wishlist state is read after mount (localStorage is client-only) and kept in
  // sync via the shared event so every heart for this slug updates together.
  const [wished, setWished] = useState(false);
  useEffect(() => {
    const sync = () => setWished(isInWishlist(product.slug));
    sync();
    window.addEventListener(WISHLIST_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(WISHLIST_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [product.slug]);

  const onToggleWish = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setWished(toggleWishlist(product.slug));
  };

  return (
    <article className="group relative flex flex-col bg-paper">
      <Link href={`/produkt/${product.slug}`} className="relative block overflow-hidden">
        <div className="relative aspect-[3/4] w-full bg-mist">
          {/* primary */}
          <Image
            src={primary}
            alt={product.name_bg}
            fill
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-opacity duration-500 ease-editorial group-hover:opacity-0"
          />
          {/* secondary swap on hover, with a slow zoom */}
          <Image
            src={secondary}
            alt=""
            aria-hidden
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="scale-105 object-cover opacity-0 transition-all duration-700 ease-editorial group-hover:scale-100 group-hover:opacity-100"
          />

          {/* badges */}
          <div className="absolute left-3 top-3 flex flex-col gap-1.5">
            {product.is_new && (
              <span className="bg-noir px-2 py-1 text-[0.58rem] uppercase tracking-widest2 text-paper">
                Ново
              </span>
            )}
            {onSale && (
              <span className="bg-paper px-2 py-1 text-[0.58rem] uppercase tracking-widest2 text-ink">
                Промо
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* wishlist toggle — always visible, top-right corner of the image */}
      <button
        type="button"
        onClick={onToggleWish}
        aria-label={wished ? "Премахни от любими" : "Добави в любими"}
        aria-pressed={wished}
        className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center bg-paper text-ink shadow-sm transition-colors hover:bg-noir hover:text-paper"
      >
        <Heart className="h-4 w-4" strokeWidth={1.6} fill={wished ? "currentColor" : "none"} />
      </button>

      {/* quick add — sits below the heart; appears on hover (desktop), always
          tappable (mobile). Hidden when the product is sold out. */}
      {!soldOut && (
        <button
          type="button"
          onClick={quickAdd}
          aria-label={`Добави ${product.name_bg} в кошницата`}
          className="absolute right-3 top-14 flex h-9 w-9 items-center justify-center bg-paper text-ink opacity-100 shadow-sm transition-all duration-300 ease-editorial hover:bg-noir hover:text-paper lg:opacity-0 lg:group-hover:opacity-100"
        >
          <Plus className="h-4 w-4" strokeWidth={1.6} />
        </button>
      )}

      {/* meta */}
      <div className="flex flex-col gap-2 py-3.5">
        <div className="flex items-start justify-between gap-3">
          <Link
            href={`/produkt/${product.slug}`}
            className="text-[0.82rem] font-medium leading-snug hover:opacity-70"
          >
            {product.name_bg}
          </Link>
          <div className="shrink-0 text-right">
            <span className="text-[0.82rem] tabular-nums">{formatEUR(product.price_bgn)}</span>
            {onSale && (
              <span className="ml-1.5 text-[0.72rem] text-ash line-through tabular-nums">
                {formatEUR(product.compare_at_bgn!)}
              </span>
            )}
          </div>
        </div>

        {/* colour dots */}
        {product.colors.length > 0 && (
          <div className="flex items-center gap-1.5">
            {product.colors.map((c) => (
              <span
                key={c.name}
                title={c.name}
                className="h-3 w-3 rounded-full border border-hairline"
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
