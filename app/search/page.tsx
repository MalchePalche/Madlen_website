import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { searchProducts } from "@/lib/products";
import { ProductGrid } from "@/components/product/ProductGrid";
import { Reveal } from "@/components/ui/Reveal";

export const metadata: Metadata = { title: "Търсене", robots: { index: false } };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = (searchParams.q ?? "").trim();
  const results = q ? await searchProducts(q) : [];

  return (
    <div className="gutter mx-auto max-w-edge pb-24 pt-10 lg:pt-14">
      <Reveal>
        <p className="eyebrow">Търсене</p>
        <h1 className="mt-3 font-display text-4xl lg:text-5xl">
          {q ? <>Резултати за „{q}“</> : "Търсене"}
        </h1>
        {q && (
          <p className="mt-3 text-sm text-ash">
            {results.length} {results.length === 1 ? "продукт" : "продукта"}
          </p>
        )}
      </Reveal>

      <div className="mt-10">
        {!q ? (
          <div className="flex flex-col items-center gap-5 border border-hairline py-24 text-center">
            <Search className="h-10 w-10 text-ash" strokeWidth={1} />
            <div>
              <p className="font-display text-2xl">Какво търсите?</p>
              <p className="mx-auto mt-2 max-w-sm text-sm text-ash">
                Използвайте иконата за търсене в горната лента, за да намерите продукти по име.
              </p>
            </div>
            <Link href="/novo" className="btn-noir">
              Разгледай новите продукти
            </Link>
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center gap-5 border border-hairline py-24 text-center">
            <Search className="h-10 w-10 text-ash" strokeWidth={1} />
            <div>
              <p className="font-display text-2xl">Няма намерени продукти</p>
              <p className="mx-auto mt-2 max-w-sm text-sm text-ash">
                Не открихме резултати за „{q}“. Опитайте с друга дума или разгледайте колекциите.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/damsko" className="btn-outline">
                Дамско
              </Link>
              <Link href="/muzhko" className="btn-outline">
                Мъжко
              </Link>
            </div>
          </div>
        ) : (
          <ProductGrid products={results} priorityCount={4} />
        )}
      </div>
    </div>
  );
}
