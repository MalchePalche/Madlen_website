import type { Product, ProductColor } from "./types";
import { CATEGORIES } from "./config";

export type SortKey = "new" | "price-asc" | "price-desc";

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "new", label: "Най-нови" },
  { value: "price-asc", label: "Цена: ниска → висока" },
  { value: "price-desc", label: "Цена: висока → ниска" },
];

export interface CollectionFilters {
  categories: string[];
  sizes: string[];
  colors: string[];
  minPrice: number | null;
  maxPrice: number | null;
  sort: SortKey;
}

/** searchParams as Next.js hands them to a page. */
export type SearchParams = Record<string, string | string[] | undefined>;

function csv(v: string | string[] | undefined): string[] {
  if (!v) return [];
  const s = Array.isArray(v) ? v.join(",") : v;
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function num(v: string | string[] | undefined): number | null {
  const s = Array.isArray(v) ? v[0] : v;
  if (s == null || s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function parseFilters(sp: SearchParams): CollectionFilters {
  const raw = (Array.isArray(sp.sort) ? sp.sort[0] : sp.sort) ?? "";
  const sort: SortKey = (["new", "price-asc", "price-desc"] as const).includes(raw as SortKey)
    ? (raw as SortKey)
    : "new";
  return {
    categories: csv(sp.cat),
    sizes: csv(sp.size),
    colors: csv(sp.color),
    minPrice: num(sp.min),
    maxPrice: num(sp.max),
    sort,
  };
}

/** True when any narrowing filter is active (sort alone doesn't count). */
export function hasActiveFilters(f: CollectionFilters): boolean {
  return (
    f.categories.length > 0 ||
    f.sizes.length > 0 ||
    f.colors.length > 0 ||
    f.minPrice != null ||
    f.maxPrice != null
  );
}

export function applyFilters(products: Product[], f: CollectionFilters): Product[] {
  const rows = products.filter((p) => {
    if (f.categories.length && !f.categories.includes(p.category)) return false;
    if (f.sizes.length && !p.sizes.some((s) => f.sizes.includes(s))) return false;
    if (f.colors.length && !p.colors.some((c) => f.colors.includes(c.name))) return false;
    if (f.minPrice != null && p.price_bgn < f.minPrice) return false;
    if (f.maxPrice != null && p.price_bgn > f.maxPrice) return false;
    return true;
  });

  switch (f.sort) {
    case "price-asc":
      return rows.sort((a, b) => a.price_bgn - b.price_bgn);
    case "price-desc":
      return rows.sort((a, b) => b.price_bgn - a.price_bgn);
    default:
      return rows.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
  }
}

export interface Facets {
  categories: { slug: string; label: string; count: number }[];
  sizes: string[];
  colors: ProductColor[];
  priceBounds: { min: number; max: number };
}

const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL"];

/** Derive the available filter options + counts from a base set of products. */
export function computeFacets(products: Product[]): Facets {
  const catCount = new Map<string, number>();
  const sizeSet = new Set<string>();
  const colorMap = new Map<string, ProductColor>();
  let min = Infinity;
  let max = 0;

  for (const p of products) {
    catCount.set(p.category, (catCount.get(p.category) ?? 0) + 1);
    p.sizes.forEach((s) => sizeSet.add(s));
    p.colors.forEach((c) => colorMap.set(c.name, c));
    min = Math.min(min, p.price_bgn);
    max = Math.max(max, p.price_bgn);
  }

  const categories = CATEGORIES.filter((c) => catCount.has(c.slug)).map((c) => ({
    slug: c.slug,
    label: c.label,
    count: catCount.get(c.slug)!,
  }));

  const sizes = [...sizeSet].sort((a, b) => {
    const ia = SIZE_ORDER.indexOf(a);
    const ib = SIZE_ORDER.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

  return {
    categories,
    sizes,
    colors: [...colorMap.values()],
    priceBounds: {
      min: Number.isFinite(min) ? Math.floor(min) : 0,
      max: Math.ceil(max) || 0,
    },
  };
}
