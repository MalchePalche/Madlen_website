import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "@/components/admin/ProductForm";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Редакция на продукт" };

export default async function EditProductPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("slug", params.slug)
    .maybeSingle();

  if (!data) notFound();
  const product = data as Product;

  return (
    <div className="p-6 lg:p-8">
      <Link
        href="/admin/prodakti"
        className="inline-flex items-center gap-2 text-[0.78rem] uppercase tracking-widest2 text-ash transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.6} /> Към продуктите
      </Link>
      <h1 className="mt-4 border-b border-hairline pb-6 font-display text-3xl lg:text-4xl">
        Редакция: {product.name_bg}
      </h1>

      <div className="mt-8">
        <ProductForm product={product} />
      </div>
    </div>
  );
}
