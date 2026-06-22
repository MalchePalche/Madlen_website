import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProductForm } from "@/components/admin/ProductForm";

export const metadata = { title: "Нов продукт" };

export default function NewProductPage() {
  return (
    <div className="p-6 lg:p-8">
      <Link
        href="/admin/prodakti"
        className="inline-flex items-center gap-2 text-[0.78rem] uppercase tracking-widest2 text-ash transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.6} /> Към продуктите
      </Link>
      <h1 className="mt-4 border-b border-hairline pb-6 font-display text-3xl lg:text-4xl">
        Нов продукт
      </h1>

      <div className="mt-8">
        <ProductForm />
      </div>
    </div>
  );
}
