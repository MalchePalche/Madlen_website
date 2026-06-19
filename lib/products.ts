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

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (!isSupabaseConfigured()) {
    return MOCK_PRODUCTS.find((p) => p.slug === slug) ?? null;
  }
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("slug", slug)
      .single();
    if (error || !data) return MOCK_PRODUCTS.find((p) => p.slug === slug) ?? null;
    return data as Product;
  } catch {
    return MOCK_PRODUCTS.find((p) => p.slug === slug) ?? null;
  }
}
