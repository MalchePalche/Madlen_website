import type { Product } from "@/lib/types";
import { ProductCard } from "./ProductCard";
import { Reveal } from "@/components/ui/Reveal";

export function RelatedProducts({ products }: { products: Product[] }) {
  if (products.length === 0) return null;

  return (
    <section className="mt-24 lg:mt-32">
      <Reveal className="mb-8 lg:mb-12">
        <p className="eyebrow">Подобни продукти</p>
        <h2 className="mt-3 font-display text-3xl lg:text-4xl">Може да харесате</h2>
      </Reveal>

      <Reveal delay={0.05}>
        {/* horizontal scroll-snap on mobile, grid on desktop */}
        <div className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4 lg:gap-6 [&::-webkit-scrollbar]:hidden">
          {products.map((p) => (
            <div key={p.id} className="w-[68%] shrink-0 snap-start sm:w-auto">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
