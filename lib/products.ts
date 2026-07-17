import { createClient, isSupabaseConfigured } from "./supabase/server";
import { MOCK_PRODUCTS } from "./mock-products";
import type { Gender, Product } from "./types";

interface ProductQuery {
  gender?: Gender;
  category?: string;
  isNew?: boolean;
  /** Only products carrying a valid strike-through original price (on sale). */
  onSale?: boolean;
  limit?: number;
}

/** True when a product has a strike-through original price above its current price. */
export function isOnSale(p: Product): boolean {
  return p.compare_at_bgn != null && p.compare_at_bgn > p.price_bgn;
}

function filterMock(query: ProductQuery): Product[] {
  let rows = [...MOCK_PRODUCTS];
  if (query.gender) {
    rows = rows.filter((p) => p.gender === query.gender || p.gender === "unisex");
  }
  if (query.category) rows = rows.filter((p) => p.category === query.category);
  if (query.isNew) rows = rows.filter((p) => p.is_new);
  if (query.onSale) rows = rows.filter(isOnSale);
  rows.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
  return typeof query.limit === "number" ? rows.slice(0, query.limit) : rows;
}

/**
 * Fetch products from Supabase, falling back to the local catalogue when
 * Supabase is not configured or a query fails. This keeps the site fully
 * renderable before the backend env vars are wired up.
 */
export async function getProducts(query: ProductQuery = {}): Promise<Product[]> {
  if (!isSupabaseConfigured()) return filterMock(query);

  try {
    const supabase = createClient();
    let q = supabase.from("products").select("*").order("created_at", { ascending: false });

    if (query.gender) q = q.in("gender", [query.gender, "unisex"]);
    if (query.category) q = q.eq("category", query.category);
    if (query.isNew) q = q.eq("is_new", true);
    if (query.onSale) q = q.not("compare_at_bgn", "is", null);
    // PostgREST can't compare two columns, so the `compare_at_bgn > price_bgn`
    // refinement runs in JS below — defer the limit until after that filter so
    // we don't slice the set before the sale check trims it.
    if (typeof query.limit === "number" && !query.onSale) q = q.limit(query.limit);

    const { data, error } = await q;
    if (error || !data || data.length === 0) return filterMock(query);

    let rows = data as Product[];
    if (query.onSale) {
      rows = rows.filter(isOnSale);
      if (typeof query.limit === "number") rows = rows.slice(0, query.limit);
    }
    return rows;
  } catch {
    return filterMock(query);
  }
}

/**
 * New-arrivals rail: prefer products flagged `is_new`, then top up with the most
 * recent remaining products (created_at desc, already the default order) so the
 * grid always fills to `limit` even when few items carry the flag.
 */
export async function getNewArrivals(limit = 8): Promise<Product[]> {
  const flagged = await getProducts({ isNew: true });
  if (flagged.length >= limit) return flagged.slice(0, limit);

  const recent = await getProducts();
  const seen = new Set(flagged.map((p) => p.id));
  const fill = recent.filter((p) => !seen.has(p.id));

  return [...flagged, ...fill].slice(0, limit);
}

/**
 * On-sale rail/collection: products whose `compare_at_bgn` sits above the
 * current price. Ordered newest-first (getProducts default). Pass `limit` for
 * the homepage rail; omit it for the full /namalenia collection.
 */
export async function getSaleProducts(limit?: number): Promise<Product[]> {
  return getProducts({ onSale: true, limit });
}

/** A resolved Lookbook mosaic tile — label/link are fixed, image is dynamic. */
export interface LookbookTile {
  label: string;
  href: string;
  className: string;
  image: string;
}

/**
 * Lookbook mosaic config: each tile keeps a fixed label/link and pulls its
 * image from one real product (`query`). `placeholder` is the Unsplash fallback
 * shown when the query finds no product or that product has no image.
 */
const LOOKBOOK_TILES: (Omit<LookbookTile, "image"> & {
  query: ProductQuery;
  placeholder: string;
})[] = [
  {
    label: "Дамско лято",
    href: "/damsko",
    className: "md:col-span-2 md:row-span-2 aspect-[3/4] md:aspect-auto",
    query: { gender: "female", category: "rokli", limit: 1 },
    placeholder:
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1100&q=80",
  },
  {
    label: "Мъжко",
    href: "/muzhko",
    className: "aspect-[4/5]",
    query: { category: "rokli", limit: 1 },
    placeholder:
      "https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=900&q=80",
  },
  {
    label: "Връхни дрехи",
    href: "/novo",
    className: "aspect-[4/5]",
    query: { category: "topove", limit: 1 },
    placeholder:
      "https://images.unsplash.com/photo-1611312449408-fcece27cdbb7?auto=format&fit=crop&w=900&q=80",
  },
  {
    label: "Нови сетове",
    href: "/novo",
    className: "md:col-span-2 aspect-[16/7]",
    query: { isNew: true, category: "setove", limit: 1 },
    placeholder:
      "https://images.unsplash.com/photo-1485231183945-fffde7cc051e?auto=format&fit=crop&w=1100&q=80",
  },
];

/**
 * Resolve the four Lookbook tiles, each backed by a real product image and
 * degrading to its placeholder when no product/image is available. Queries run
 * in parallel so the mosaic costs a single round-trip's latency.
 */
export async function getLookbookTiles(): Promise<LookbookTile[]> {
  return Promise.all(
    LOOKBOOK_TILES.map(async ({ query, placeholder, ...tile }) => {
      const [product] = await getProducts(query);
      return { ...tile, image: product?.images?.[0] ?? placeholder };
    }),
  );
}

/** Products from the same gender, prioritising the same category, excluding the current product. */
export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  const pool = await getProducts({ gender: product.gender });
  const sameCat = pool.filter((p) => p.id !== product.id && p.category === product.category);
  const others = pool.filter((p) => p.id !== product.id && p.category !== product.category);
  return [...sameCat, ...others].slice(0, limit);
}

/** Free-text fields searched on every query (besides the synonym→category map). */
const SEARCH_FIELDS = ["name_bg", "name_en", "description_bg", "category"] as const;

/**
 * Maps common Bulgarian search terms to the category slug they should also
 * match, so "рокля"/"рокли" surface `rokli` products even when no name field
 * literally contains the word.
 */
const CATEGORY_SYNONYMS: Record<string, string> = {
  рокля: "rokli",
  рокли: "rokli",
  сет: "setove",
  сетове: "setove",
  блуза: "topove",
  топ: "topove",
  панталон: "pantaloni",
  панталони: "pantaloni",
};

/** Split a query into sanitised words, dropping chars that break PostgREST. */
function searchTerms(q: string): string[] {
  return q
    .split(/\s+/)
    .map((w) => w.replace(/[%,()]/g, "").trim())
    .filter(Boolean);
}

/**
 * Full-text-ish search over names, description and category (Bulgarian +
 * English). Every word is matched independently and OR-combined, so any product
 * hitting any term on any field surfaces. Synonyms also map terms to a category.
 */
export async function searchProducts(query: string, limit = 24): Promise<Product[]> {
  const q = query.trim();
  // Require at least two characters before searching to avoid noisy 1-char hits.
  if (q.length < 2) return [];

  const terms = searchTerms(q);

  const matchMock = () =>
    MOCK_PRODUCTS.filter((p) =>
      terms.some((w) => {
        const lw = w.toLowerCase();
        return (
          p.name_bg.toLowerCase().includes(lw) ||
          p.name_en.toLowerCase().includes(lw) ||
          (p.description_bg ?? "").toLowerCase().includes(lw) ||
          p.category.toLowerCase().includes(lw) ||
          CATEGORY_SYNONYMS[lw] === p.category
        );
      }),
    ).slice(0, limit);

  if (!isSupabaseConfigured()) return matchMock();

  try {
    const supabase = createClient();
    // Build one OR filter: every word × every field, plus any synonym→category.
    const clauses = terms.flatMap((w) => {
      const c = SEARCH_FIELDS.map((f) => `${f}.ilike.%${w}%`);
      const slug = CATEGORY_SYNONYMS[w.toLowerCase()];
      if (slug) c.push(`category.ilike.%${slug}%`);
      return c;
    });

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .or(clauses.join(","))
      .order("created_at", { ascending: false })
      .limit(limit);
    // Only degrade to mock on a real failure — an empty result is a valid
    // "no matches" and must surface the empty state.
    if (error) return matchMock();
    return (data as Product[]) ?? [];
  } catch {
    return matchMock();
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (!isSupabaseConfigured()) {
    return MOCK_PRODUCTS.find((p) => p.slug === slug) ?? null;
  }
  try {
    const supabase = createClient();
    // maybeSingle(): a non-matching slug returns { data: null, error: null }
    // instead of an error, so a genuinely-missing product is no longer
    // conflated with a real fetch failure. .single() reports "no rows" AS an
    // error (PGRST116), which is what made the page 404 on any query hiccup.
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    // A real fetch failure (network/RLS/bad env) must not masquerade as a 404 —
    // degrade to the local catalogue so a transient error doesn't 404 a product
    // that actually exists in Supabase.
    if (error) return MOCK_PRODUCTS.find((p) => p.slug === slug) ?? null;

    // No error: `data` is the row, or null when the slug truly doesn't exist.
    // Returning null lets the page call notFound() only on a genuine miss.
    return (data as Product | null) ?? null;
  } catch {
    return MOCK_PRODUCTS.find((p) => p.slug === slug) ?? null;
  }
}
