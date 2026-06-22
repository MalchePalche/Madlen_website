"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronDown, SlidersHorizontal, X, Check } from "lucide-react";
import type { Facets } from "@/lib/filters";
import { SORT_OPTIONS, type SortKey } from "@/lib/filters";
import { cn, formatEUR } from "@/lib/utils";

type FilterKey = "cat" | "size" | "color" | "price";

export function FilterBar({
  facets,
  total,
  shown,
}: {
  facets: Facets;
  total: number;
  shown: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const barRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState<FilterKey | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // current selections, read straight from the URL
  const csv = (k: string) => (sp.get(k) ?? "").split(",").filter(Boolean);
  const selCats = csv("cat");
  const selSizes = csv("size");
  const selColors = csv("color");
  const minPrice = sp.get("min") ?? "";
  const maxPrice = sp.get("max") ?? "";
  const sort = (sp.get("sort") as SortKey) || "new";

  const activeCount =
    selCats.length +
    selSizes.length +
    selColors.length +
    (minPrice ? 1 : 0) +
    (maxPrice ? 1 : 0);

  // ---- URL helpers -------------------------------------------------------
  const commit = (next: URLSearchParams) => {
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };
  const copy = () => new URLSearchParams(sp.toString());

  const toggleCsv = (key: string, value: string) => {
    const next = copy();
    const cur = (next.get(key) ?? "").split(",").filter(Boolean);
    const i = cur.indexOf(value);
    if (i >= 0) cur.splice(i, 1);
    else cur.push(value);
    if (cur.length) next.set(key, cur.join(","));
    else next.delete(key);
    commit(next);
  };

  const setParam = (key: string, value: string | null) => {
    const next = copy();
    if (value) next.set(key, value);
    else next.delete(key);
    commit(next);
  };

  const clearAll = () => router.push(pathname, { scroll: false });

  // ---- price local state (applied on submit) -----------------------------
  const [minDraft, setMinDraft] = useState(minPrice);
  const [maxDraft, setMaxDraft] = useState(maxPrice);
  useEffect(() => setMinDraft(minPrice), [minPrice]);
  useEffect(() => setMaxDraft(maxPrice), [maxPrice]);

  const applyPrice = () => {
    const next = copy();
    if (minDraft) next.set("min", minDraft);
    else next.delete("min");
    if (maxDraft) next.set("max", maxDraft);
    else next.delete("max");
    commit(next);
    setOpen(null);
  };

  // ---- close desktop popovers on outside click / Escape ------------------
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    document.body.style.overflow = sheetOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sheetOpen]);

  const catLabel = (slug: string) =>
    facets.categories.find((c) => c.slug === slug)?.label ?? slug;

  // ---- shared filter sections (reused on desktop + mobile) ---------------
  const CategorySection = () => (
    <ul className="space-y-1">
      {facets.categories.map((c) => {
        const active = selCats.includes(c.slug);
        return (
          <li key={c.slug}>
            <button
              type="button"
              onClick={() => toggleCsv("cat", c.slug)}
              className="flex w-full items-center justify-between py-1.5 text-sm hover:opacity-70"
            >
              <span className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex h-4 w-4 items-center justify-center border",
                    active ? "border-ink bg-ink text-paper" : "border-hairline",
                  )}
                >
                  {active && <Check className="h-3 w-3" strokeWidth={2.5} />}
                </span>
                {c.label}
              </span>
              <span className="text-[0.72rem] text-ash">{c.count}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );

  const SizeSection = () => (
    <div className="flex flex-wrap gap-2">
      {facets.sizes.map((s) => {
        const active = selSizes.includes(s);
        return (
          <button
            key={s}
            type="button"
            onClick={() => toggleCsv("size", s)}
            className={cn(
              "min-w-[2.75rem] border px-3 py-2 text-[0.78rem] font-medium transition-colors",
              active ? "border-ink bg-ink text-paper" : "border-hairline hover:border-ink",
            )}
          >
            {s}
          </button>
        );
      })}
    </div>
  );

  const ColorSection = () => (
    <ul className="space-y-1">
      {facets.colors.map((c) => {
        const active = selColors.includes(c.name);
        return (
          <li key={c.name}>
            <button
              type="button"
              onClick={() => toggleCsv("color", c.name)}
              className="flex w-full items-center gap-2.5 py-1.5 text-sm hover:opacity-70"
            >
              <span
                className={cn(
                  "h-4 w-4 rounded-full border",
                  active ? "ring-2 ring-ink ring-offset-1 ring-offset-paper" : "border-hairline",
                )}
                style={{ backgroundColor: c.hex }}
              />
              <span>{c.name}</span>
              {active && <Check className="ml-auto h-3.5 w-3.5" strokeWidth={2} />}
            </button>
          </li>
        );
      })}
    </ul>
  );

  const PriceSection = () => (
    <div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          inputMode="numeric"
          min={0}
          placeholder={String(facets.priceBounds.min)}
          value={minDraft}
          onChange={(e) => setMinDraft(e.target.value)}
          aria-label="Минимална цена"
          className="w-full border border-hairline bg-paper px-3 py-2 text-sm focus:border-ink focus:outline-none"
        />
        <span className="text-ash">—</span>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          placeholder={String(facets.priceBounds.max)}
          value={maxDraft}
          onChange={(e) => setMaxDraft(e.target.value)}
          aria-label="Максимална цена"
          className="w-full border border-hairline bg-paper px-3 py-2 text-sm focus:border-ink focus:outline-none"
        />
      </div>
      <p className="mt-2 text-[0.72rem] text-ash">
        Налични: {formatEUR(facets.priceBounds.min)} – {formatEUR(facets.priceBounds.max)}
      </p>
      <button type="button" onClick={applyPrice} className="btn-noir mt-3 w-full py-3">
        Приложи
      </button>
    </div>
  );

  const triggers: { key: FilterKey; label: string; count: number; render: () => JSX.Element }[] = [
    { key: "cat", label: "Категория", count: selCats.length, render: CategorySection },
    { key: "size", label: "Размер", count: selSizes.length, render: SizeSection },
    { key: "color", label: "Цвят", count: selColors.length, render: ColorSection },
    {
      key: "price",
      label: "Цена",
      count: (minPrice ? 1 : 0) + (maxPrice ? 1 : 0),
      render: PriceSection,
    },
  ];

  return (
    <div className="mt-10 border-y border-hairline" ref={barRef}>
      <div className="flex items-center justify-between gap-4 py-3">
        {/* desktop filter triggers */}
        <div className="relative hidden items-center gap-1 lg:flex">
          {triggers.map((t) => (
            <div key={t.key} className="relative">
              <button
                type="button"
                onClick={() => setOpen((o) => (o === t.key ? null : t.key))}
                aria-expanded={open === t.key}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 text-[0.78rem] uppercase tracking-widest2 font-medium transition-colors",
                  open === t.key ? "text-ink" : "text-ink/80 hover:text-ink",
                )}
              >
                {t.label}
                {t.count > 0 && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 text-[0.6rem] text-paper">
                    {t.count}
                  </span>
                )}
                <ChevronDown
                  className={cn("h-3.5 w-3.5 transition-transform", open === t.key && "rotate-180")}
                  strokeWidth={1.6}
                />
              </button>
              {open === t.key && (
                <div className="absolute left-0 top-full z-30 mt-px w-72 border border-hairline bg-paper p-4 shadow-[0_18px_40px_-20px_rgba(13,13,13,0.35)]">
                  {t.render()}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* mobile filter trigger */}
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="flex items-center gap-2 text-[0.78rem] uppercase tracking-widest2 font-medium lg:hidden"
        >
          <SlidersHorizontal className="h-4 w-4" strokeWidth={1.5} />
          Филтри
          {activeCount > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 text-[0.6rem] text-paper">
              {activeCount}
            </span>
          )}
        </button>

        {/* count + sort */}
        <div className="flex items-center gap-4">
          <span className="hidden text-[0.74rem] text-ash sm:block">
            {shown === total ? `${total} продукта` : `${shown} от ${total}`}
          </span>
          <label className="flex items-center gap-2 text-[0.74rem]">
            <span className="hidden uppercase tracking-widest2 text-ash sm:block">Сортирай</span>
            <select
              value={sort}
              onChange={(e) => setParam("sort", e.target.value === "new" ? null : e.target.value)}
              className="border border-hairline bg-paper px-3 py-2 text-[0.78rem] focus:border-ink focus:outline-none"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* active filter chips */}
      {activeCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 pb-3">
          {selCats.map((c) => (
            <Chip key={`c-${c}`} label={catLabel(c)} onRemove={() => toggleCsv("cat", c)} />
          ))}
          {selSizes.map((s) => (
            <Chip key={`s-${s}`} label={`Размер ${s}`} onRemove={() => toggleCsv("size", s)} />
          ))}
          {selColors.map((c) => (
            <Chip key={`col-${c}`} label={c} onRemove={() => toggleCsv("color", c)} />
          ))}
          {(minPrice || maxPrice) && (
            <Chip
              label={`${minPrice ? formatEUR(Number(minPrice)) : "0 €"} – ${
                maxPrice ? formatEUR(Number(maxPrice)) : "∞"
              }`}
              onRemove={() => {
                const next = copy();
                next.delete("min");
                next.delete("max");
                commit(next);
              }}
            />
          )}
          <button
            type="button"
            onClick={clearAll}
            className="ml-1 text-[0.72rem] uppercase tracking-widest2 text-ash underline-offset-4 hover:text-ink hover:underline"
          >
            Изчисти всички
          </button>
        </div>
      )}

      {/* mobile sheet */}
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          sheetOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!sheetOpen}
      >
        <div
          className={cn(
            "absolute inset-0 bg-ink/30 backdrop-blur-[2px] transition-opacity duration-300",
            sheetOpen ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setSheetOpen(false)}
        />
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 flex max-h-[88vh] flex-col bg-paper transition-transform duration-300 ease-editorial",
            sheetOpen ? "translate-y-0" : "translate-y-full",
          )}
          role="dialog"
          aria-modal="true"
          aria-label="Филтри"
        >
          <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
            <span className="text-[0.8rem] uppercase tracking-widest2 font-semibold">Филтри</span>
            <button type="button" aria-label="Затвори" onClick={() => setSheetOpen(false)} className="-mr-1 p-1.5">
              <X className="h-5 w-5" strokeWidth={1.4} />
            </button>
          </div>

          <div className="flex-1 space-y-7 overflow-y-auto px-5 py-5">
            <section>
              <h3 className="eyebrow mb-3">Категория</h3>
              <CategorySection />
            </section>
            <section>
              <h3 className="eyebrow mb-3">Размер</h3>
              <SizeSection />
            </section>
            <section>
              <h3 className="eyebrow mb-3">Цвят</h3>
              <ColorSection />
            </section>
            <section>
              <h3 className="eyebrow mb-3">Цена</h3>
              <PriceSection />
            </section>
          </div>

          <div className="flex items-center gap-3 border-t border-hairline px-5 py-4">
            {activeCount > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="text-[0.74rem] uppercase tracking-widest2 text-ash"
              >
                Изчисти
              </button>
            )}
            <button type="button" onClick={() => setSheetOpen(false)} className="btn-noir ml-auto flex-1 py-3.5">
              Покажи {shown} продукта
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 border border-hairline bg-mist px-3 py-1.5 text-[0.74rem]">
      {label}
      <button type="button" onClick={onRemove} aria-label={`Премахни ${label}`} className="hover:text-ash">
        <X className="h-3.5 w-3.5" strokeWidth={1.6} />
      </button>
    </span>
  );
}
