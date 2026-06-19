import type { Product } from "@/lib/types";
import { ProductCard } from "./ProductCard";

export function ProductGrid({
  products,
  priorityCount = 0,
}: {
  products: Product[];
  /** First N cards load eagerly (above the fold). */
  priorityCount?: number;
}) {
  if (products.length === 0) {
    return (
      <div className="border border-hairline py-24 text-center">
        <p className="font-display text-2xl">Няма продукти</p>
        <p className="mt-2 text-sm text-ash">Скоро добавяме нови артикули.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < priorityCount} />
      ))}
    </div>
  );
}
