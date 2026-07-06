"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, Truck, RotateCcw, Banknote, Lock, Heart } from "lucide-react";
import type { Product } from "@/lib/types";
import { useCart } from "@/store/cart";
import { BRAND, CATEGORIES } from "@/lib/config";
import { formatEUR, cn } from "@/lib/utils";
import { Accordion } from "@/components/ui/Accordion";
import { isInWishlist, toggleWishlist, WISHLIST_EVENT } from "@/lib/wishlist";

export function BuyPanel({ product }: { product: Product }) {
  const addItem = useCart((s) => s.addItem);

  const oosSizes = product.out_of_stock_sizes ?? [];
  const soldOut =
    product.stock <= 0 || (product.sizes.length > 0 && product.sizes.every((s) => oosSizes.includes(s)));
  const lowStock = product.stock > 0 && product.stock <= 5;
  const onSale = !!product.compare_at_bgn && product.compare_at_bgn > product.price_bgn;
  const discount = onSale
    ? Math.round((1 - product.price_bgn / product.compare_at_bgn!) * 100)
    : 0;

  const [color, setColor] = useState(product.colors[0]?.name ?? "");
  const [size, setSize] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [added, setAdded] = useState(false);

  // Mobile sticky bar: shown once the main add-to-cart button scrolls out of view.
  const buyButtonRef = useRef<HTMLButtonElement>(null);
  const sizeSectionRef = useRef<HTMLDivElement>(null);
  const [showSticky, setShowSticky] = useState(false);

  useEffect(() => {
    const el = buyButtonRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Only after we've scrolled *past* the button (its top is above the
        // viewport) — not while it's still below the fold on first load.
        setShowSticky(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Wishlist state is read after mount (localStorage is client-only) and kept in
  // sync via the shared event so the card + PDP hearts stay consistent.
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

  const categoryLabel = CATEGORIES.find((c) => c.slug === product.category)?.label ?? product.category;

  const handleAdd = (opts?: { scrollToSizeOnError?: boolean }) => {
    if (soldOut) return;
    if (product.sizes.length > 0 && !size) {
      setError(true);
      // From the sticky bar the size selector is off-screen — bring it into view
      // so the validation message is actually seen.
      if (opts?.scrollToSizeOnError) {
        sizeSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }
    addItem({
      productId: product.id,
      slug: product.slug,
      name_bg: product.name_bg,
      price_bgn: product.price_bgn,
      image: product.images[0],
      size: size ?? "ONE",
      color: color || "—",
      quantity: 1,
    });
    setError(false);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const accordion = [
    {
      title: "Описание",
      content:
        product.description_bg ??
        "Изчистен модел с внимание към кройката и детайла. Изработен от качествени материи за дълготрайна употреба и комфорт при ежедневно носене.",
    },
    {
      title: "Състав и грижа",
      content: (
        <ul className="space-y-1.5">
          {product.material_bg && (
            <li>
              <span className="text-ink">Материя:</span> {product.material_bg}
            </li>
          )}
          <li>Пране при 30°C на деликатна програма.</li>
          <li>Да не се избелва. Гладене на ниска температура.</li>
        </ul>
      ),
    },
    {
      title: "Доставка и плащане",
      content: (
        <ul className="space-y-1.5">
          <li>Доставка до адрес или офис на куриер за 1–3 работни дни.</li>
          <li>Плащане при доставка (наложен платеж) — без карта.</li>
          <li>Безплатна доставка над 100 €. Връщане до 30 дни.</li>
        </ul>
      ),
    },
  ];

  return (
    <div className="lg:sticky lg:top-24 lg:self-start">
      <p className="eyebrow">{categoryLabel}</p>
      <div className="mt-3 flex items-start justify-between gap-4">
        <h1 className="font-display text-4xl leading-tight lg:text-5xl">{product.name_bg}</h1>
        <button
          type="button"
          onClick={() => setWished(toggleWishlist(product.slug))}
          aria-label={wished ? "Премахни от любими" : "Добави в любими"}
          aria-pressed={wished}
          className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center border border-hairline text-ink transition-colors hover:border-ink"
        >
          <Heart className="h-5 w-5" strokeWidth={1.5} fill={wished ? "currentColor" : "none"} />
        </button>
      </div>

      {/* price */}
      <div className="mt-4 flex items-center gap-3">
        <span className="text-xl tabular-nums">{formatEUR(product.price_bgn)}</span>
        {onSale && (
          <>
            <span className="text-sm text-ash line-through tabular-nums">
              {formatEUR(product.compare_at_bgn!)}
            </span>
            <span className="bg-noir px-2 py-0.5 text-[0.62rem] uppercase tracking-widest2 text-paper">
              −{discount}%
            </span>
          </>
        )}
      </div>

      {/* colour selector */}
      {product.colors.length > 0 && (
        <div className="mt-8">
          <p className="text-[0.78rem] uppercase tracking-widest2 text-ash">
            Цвят: <span className="text-ink">{color}</span>
          </p>
          <div className="mt-3 flex flex-wrap gap-2.5">
            {product.colors.map((c) => (
              <button
                key={c.name}
                type="button"
                aria-label={c.name}
                aria-pressed={color === c.name}
                onClick={() => setColor(c.name)}
                className={cn(
                  "h-8 w-8 rounded-full border transition-transform",
                  color === c.name
                    ? "ring-2 ring-ink ring-offset-2 ring-offset-paper"
                    : "border-hairline hover:scale-105",
                )}
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
        </div>
      )}

      {/* size selector */}
      {product.sizes.length > 0 && (
        <div ref={sizeSectionRef} className="mt-7">
          <div className="flex items-center justify-between">
            <p className="text-[0.78rem] uppercase tracking-widest2 text-ash">Размер</p>
            <Link href="/razmerna-tablica" className="text-[0.74rem] text-ash underline-offset-4 hover:text-ink hover:underline">
              Таблица с размери
            </Link>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {product.sizes.map((s) => {
              const disabled = oosSizes.includes(s);
              const selected = size === s;
              return (
                <button
                  key={s}
                  type="button"
                  disabled={disabled}
                  aria-pressed={selected}
                  onClick={() => {
                    setSize(s);
                    setError(false);
                  }}
                  className={cn(
                    "min-w-[3rem] border px-4 py-3 text-sm font-medium transition-colors",
                    disabled && "cursor-not-allowed text-ash line-through opacity-50",
                    !disabled && selected && "border-ink bg-ink text-paper",
                    !disabled && !selected && "border-hairline hover:border-ink",
                  )}
                  title={disabled ? "Изчерпан размер" : undefined}
                >
                  {s}
                </button>
              );
            })}
          </div>
          {error && (
            <p role="alert" className="mt-2 text-[0.78rem] text-ink">
              Моля, изберете размер.
            </p>
          )}
        </div>
      )}

      {/* low-stock warning */}
      {lowStock && !soldOut && (
        <p className="mt-5 text-[0.78rem] font-medium text-amber-600">
          Само {product.stock} бр. останали
        </p>
      )}

      {/* add to cart */}
      <button
        ref={buyButtonRef}
        type="button"
        onClick={() => handleAdd()}
        disabled={soldOut}
        className={cn(
          "btn-noir mt-6 w-full",
          soldOut && "cursor-not-allowed bg-ash hover:bg-ash",
        )}
      >
        {soldOut ? "Изчерпан" : added ? (
          <>
            <Check className="h-4 w-4" strokeWidth={2} /> Добавено в кошницата
          </>
        ) : (
          "Добави в кошницата"
        )}
      </button>
      {soldOut && (
        <p className="mt-2 text-center text-[0.78rem] text-ash">
          Този продукт е изчерпан в момента.
        </p>
      )}

      {/* trust badges */}
      <ul className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-ash">
        <li className="inline-flex items-center gap-1.5 text-[0.75rem]">
          <Lock className="h-3.5 w-3.5" strokeWidth={1.5} /> Сигурно плащане
        </li>
        <li className="inline-flex items-center gap-1.5 text-[0.75rem]">
          <Truck className="h-3.5 w-3.5" strokeWidth={1.5} /> Безплатна доставка над {BRAND.freeShippingThreshold} €
        </li>
        <li className="inline-flex items-center gap-1.5 text-[0.75rem]">
          <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} /> Връщане до 30 дни
        </li>
      </ul>

      {/* quick facts */}
      <ul className="mt-7 space-y-3 border-t border-hairline pt-6 text-[0.82rem]">
        <li className="flex items-center gap-3">
          <Banknote className="h-4 w-4 text-ash" strokeWidth={1.5} /> Плащане при доставка (наложен платеж)
        </li>
        <li className="flex items-center gap-3">
          <Truck className="h-4 w-4 text-ash" strokeWidth={1.5} /> Доставка 1–3 работни дни
        </li>
        <li className="flex items-center gap-3">
          <RotateCcw className="h-4 w-4 text-ash" strokeWidth={1.5} /> Връщане до 30 дни
        </li>
      </ul>

      {/* details accordion */}
      <div className="mt-8">
        <Accordion items={accordion} defaultOpen={0} />
      </div>

      {/* sticky mobile add-to-cart — slides up once the main button scrolls away */}
      <div
        aria-hidden={!showSticky}
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 border-t border-hairline bg-white pb-[env(safe-area-inset-bottom)] transition-transform duration-300 md:hidden",
          showSticky ? "translate-y-0" : "pointer-events-none translate-y-full",
        )}
      >
        <div className="gutter flex items-center gap-3 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium leading-tight">{product.name_bg}</p>
            <p className="mt-0.5 text-[0.72rem] text-ash">
              {size && <span>Размер {size} · </span>}
              <span className="tabular-nums text-ink">{formatEUR(product.price_bgn)}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleAdd({ scrollToSizeOnError: true })}
            disabled={soldOut}
            className={cn(
              "btn-noir shrink-0",
              soldOut && "cursor-not-allowed bg-ash hover:bg-ash",
            )}
          >
            {soldOut ? (
              "Изчерпан"
            ) : added ? (
              <>
                <Check className="h-4 w-4" strokeWidth={2} /> Добавено
              </>
            ) : (
              "Добави в кошницата"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
