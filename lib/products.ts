import { createClient, isSupabaseConfigured } from "./supabase/server";
import { MOCK_PRODUCTS } from "./mock-products";
import type { Gender, Product } from "./types";

interface ProductQuery {
  gender?: Gender;
  category?: string;
  isNew?: boolean;
  limit?: number;
}

function filterMock(query: ProductQuery): Product[] {
  let rows = [...MOCK_PRODUCTS];
  if (query.gender) {
    rows = rows.filter((p) => p.gender === query.gender || p.gender === "unisex");
  }
  if (query.category) rows = rows.filter((p) => p.category === query.category);
  if (query.isNew) rows = rows.filter((p) => p.is_new);
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
    if (typeof query.limit === "number") q = q.limit(query.limit);

    const { data, error } = await q;
    if (error || !data || data.length === 0) return filterMock(query);
    return data as Product[];
  } catch {
    return filterMock(query);
  }
}

export async function getNewArrivals(limit = 8): Promise<Product[]> {
  return getProducts({ isNew: true, limit });
}

/** Products from the same gender, prioritising the same category, excluding the current product. */
export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  const pool = await getProducts({ gender: product.gender });
  const sameCat = pool.filter((p) => p.id !== product.id && p.category === product.category);
  const others = pool.filter((p) => p.id !== product.id && p.category !== product.category);
  return [...sameCat, ...others].slice(0, limit);
}

/** Full-text-ish search over product names (Bulgarian + English). */
export async function searchProducts(query: string, limit = 24): Promise<Product[]> {
  const q = query.trim();
  if (!q) return [];

  const matchMock = () => {
    const lower = q.toLowerCase();
    return MOCK_PRODUCTS.filter(
      (p) =>
        p.name_bg.toLowerCase().includes(lower) ||
        p.name_en.toLowerCase().includes(lower) ||
        p.category.toLowerCase().includes(lower),
    ).slice(0, limit);
  };

  if (!isSupabaseConfigured()) return matchMock();

  try {
    const supabase = createClient();
    // strip characters that would break the PostgREST or-filter grammar
    const safe = q.replace(/[%,()]/g, " ").trim();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .or(`name_bg.ilike.%${safe}%,name_en.ilike.%${safe}%`)
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
