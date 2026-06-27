import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ProductTable } from "@/components/admin/ProductTable";
import { PullToRefresh, RefreshButton } from "@/components/admin/PullToRefresh";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });
  const products = (data ?? []) as Product[];

  return (
    <PullToRefresh>
      <div className="lg:p-8">
        <header className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-30 flex flex-wrap items-end justify-between gap-3 border-b border-hairline bg-paper px-5 py-4 lg:static lg:px-0 lg:py-0 lg:pb-6">
          <div>
            <p className="eyebrow">{products.length} продукта</p>
            <h1 className="mt-1 font-display text-2xl lg:mt-2 lg:text-4xl">Продукти</h1>
          </div>
          <div className="flex items-center gap-2">
            <RefreshButton />
            <Link href="/admin/prodakti/nov" className="btn-noir">
              <Plus className="h-4 w-4" strokeWidth={2} />
              Нов продукт
            </Link>
          </div>
        </header>

        <div className="px-5 pb-6 pt-6 lg:px-0 lg:pb-0 lg:pt-8">
          <ProductTable products={products} />
        </div>
      </div>
    </PullToRefresh>
  );
}
