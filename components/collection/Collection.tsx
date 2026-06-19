import Link from "next/link";
import { getProducts } from "@/lib/products";
import { parseFilters, applyFilters, computeFacets, hasActiveFilters } from "@/lib/filters";
import type { Gender } from "@/lib/types";
import type { SearchParams } from "@/lib/filters";
import { ProductGrid } from "@/components/product/ProductGrid";
import { Reveal } from "@/components/ui/Reveal";
import { FilterBar } from "./FilterBar";

interface CollectionProps {
  eyebrow: string;
  title: string;
  description?: string;
  /** Route base: a gender route, or the "new arrivals" route. */
  base: { gender?: Gender; isNew?: boolean };
  basePath: string;
  searchParams: SearchParams;
}

export async function Collection({
  eyebrow,
  title,
  description,
  base,
  basePath,
  searchParams,
}: CollectionProps) {
  const all = await getProducts(base);
  const facets = computeFacets(all);
  const filters = parseFilters(searchParams);
  const products = applyFilters(all, filters);

  return (
    <div className="gutter mx-auto max-w-edge pb-24 pt-10 lg:pt-14">
      <Reveal className="text-center">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-3 font-display text-5xl lg:text-6xl">{title}</h1>
        {description && <p className="mx-auto mt-4 max-w-md text-sm text-ash">{description}</p>}
      </Reveal>

      <FilterBar facets={facets} total={all.length} shown={products.length} />

      <div className="mt-10">
        {products.length === 0 ? (
          <div className="border border-hairline py-24 text-center">
            <p className="font-display text-2xl">Няма съвпадения</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-ash">
              {hasActiveFilters(filters)
                ? "Опитайте с по-малко филтри или ги изчистете."
                : "Скоро добавяме нови артикули в тази категория."}
            </p>
            {hasActiveFilters(filters) && (
              <Link href={basePath} className="btn-outline mt-6">
                Изчисти филтрите
              </Link>
            )}
          </div>
        ) : (
          <ProductGrid products={products} priorityCount={4} />
        )}
      </div>
    </div>
  );
}
