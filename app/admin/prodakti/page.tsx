import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ProductTable } from "@/components/admin/ProductTable";
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
    <div className="p-6 lg:p-8">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-hairline pb-6">
        <div>
          <p className="eyebrow">{products.length} продукта</p>
          <h1 className="mt-2 font-display text-3xl lg:text-4xl">Продукти</h1>
        </div>
        <Link href="/admin/prodakti/nov" className="btn-noir">
          <Plus className="h-4 w-4" strokeWidth={2} />
          Нов продукт
        </Link>
      </header>

      <div className="mt-8">
        <ProductTable products={products} />
      </div>
    </div>
  );
}
