import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Product } from "@/lib/types";
import { ProductGrid } from "@/components/product/ProductGrid";
import { Reveal } from "@/components/ui/Reveal";

export function NewArrivals({ products }: { products: Product[] }) {
  return (
    <section className="gutter mx-auto max-w-edge py-20 lg:py-28">
      <Reveal className="mb-10 flex items-end justify-between gap-4 lg:mb-14">
        <div>
          <p className="eyebrow">Ново при нас</p>
          <h2 className="mt-3 font-display text-4xl lg:text-5xl">Нови предложения</h2>
        </div>
        <Link
          href="/novo"
          className="group inline-flex shrink-0 items-center gap-2 text-[0.74rem] uppercase tracking-widest2 font-medium"
        >
          Виж всички
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={1.5} />
        </Link>
      </Reveal>

      <Reveal delay={0.05}>
        <ProductGrid products={products} priorityCount={4} />
      </Reveal>

      <div className="mt-10 flex justify-center">
        <Link href="/novo" className="btn-outline">
          Виж всички
        </Link>
      </div>
    </section>
  );
}
