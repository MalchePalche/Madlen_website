"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getWishlist, WISHLIST_EVENT } from "@/lib/wishlist";
import { createClient, isSupabaseConfiguredClient } from "@/lib/supabase/client";
import { MOCK_PRODUCTS } from "@/lib/mock-products";
import { ProductGrid } from "@/components/product/ProductGrid";
import type { Product } from "@/lib/types";

/** Fetch the wishlisted products by slug, preserving the saved order. */
async function fetchWishlisted(slugs: string[]): Promise<Product[]> {
  const rank = new Map(slugs.map((s, i) => [s, i]));
  const byRank = (a: Product, b: Product) => (rank.get(a.slug) ?? 0) - (rank.get(b.slug) ?? 0);
  const fromMock = () => MOCK_PRODUCTS.filter((p) => rank.has(p.slug)).sort(byRank);

  if (!isSupabaseConfiguredClient()) return fromMock();

  try {
    const supabase = createClient();
    const { data, error } = await supabase.from("products").select("*").in("slug", slugs);
    if (error || !data) return fromMock();
    return (data as Product[]).sort(byRank);
  } catch {
    return fromMock();
  }
}

export default function WishlistPage() {
  // null = not yet read on the client (avoids a flash of the empty state during SSR/hydration).
  const [slugs, setSlugs] = useState<string[] | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Read the wishlist after mount and stay in sync with changes (this tab + others).
  useEffect(() => {
    const sync = () => setSlugs(getWishlist());
    sync();
    window.addEventListener(WISHLIST_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(WISHLIST_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  // Refetch whenever the set of slugs changes.
  useEffect(() => {
    if (slugs === null) return;
    if (slugs.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    fetchWishlisted(slugs).then((rows) => {
      if (active) {
        setProducts(rows);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slugs?.join(",")]);

  return (
    <div className="gutter mx-auto max-w-edge py-10 lg:py-14">
      <header className="mb-8">
        <p className="eyebrow">Запазени</p>
        <h1 className="mt-2 font-display text-4xl lg:text-5xl">Любими продукти</h1>
      </header>

      {loading ? (
        <div className="py-24 text-center text-sm text-ash">Зареждане…</div>
      ) : products.length === 0 ? (
        <div className="border border-hairline py-24 text-center">
          <p className="font-display text-2xl">Нямате запазени продукти</p>
          <p className="mt-2 text-sm text-ash">
            Докоснете сърцето върху продукт, за да го запазите тук.
          </p>
          <Link href="/damsko" className="btn-noir mt-6 inline-flex">
            Разгледай дамската колекция
          </Link>
        </div>
      ) : (
        <ProductGrid products={products} />
      )}
    </div>
  );
}
