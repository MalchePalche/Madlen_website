import Link from "next/link";
import { CATEGORIES } from "@/lib/config";
import { Reveal } from "@/components/ui/Reveal";

export function CategoryPills() {
  return (
    <section className="gutter mx-auto max-w-edge py-20 lg:py-24">
      <Reveal className="text-center">
        <p className="eyebrow">Разгледай по категория</p>
        <h2 className="mt-3 font-display text-4xl lg:text-5xl">Категории</h2>
      </Reveal>

      <Reveal delay={0.05} className="mt-10 flex flex-wrap justify-center gap-3">
        {CATEGORIES.map((c) => (
          <Link
            key={c.slug}
            href={`/novo?cat=${c.slug}`}
            className="border border-ink px-6 py-3 text-[0.74rem] uppercase tracking-widest2 font-medium transition-colors duration-300 ease-editorial hover:bg-ink hover:text-paper"
          >
            {c.label}
          </Link>
        ))}
      </Reveal>
    </section>
  );
}
