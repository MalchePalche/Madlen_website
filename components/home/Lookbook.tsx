import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { getLookbookTiles } from "@/lib/products";

export async function Lookbook() {
  const tiles = await getLookbookTiles();

  return (
    <section className="bg-mist py-20 lg:py-28">
      <div className="gutter mx-auto max-w-edge">
        <Reveal className="mb-10 text-center lg:mb-14">
          <p className="eyebrow">Lookbook</p>
          <h2 className="mt-3 font-display text-4xl lg:text-5xl">Какво да облечеш</h2>
          <p className="mx-auto mt-4 max-w-md text-sm text-ash">
            Готови визии за сезона — комбинирани от нашите стилисти.
          </p>
        </Reveal>

        <Reveal delay={0.05}>
          <div className="grid auto-rows-[minmax(0,1fr)] grid-cols-1 gap-4 md:grid-cols-4">
            {tiles.map((t) => {
              const comingSoon = t.href === "/muzhko";
              return (
                <Link
                  key={t.label}
                  href={t.href}
                  className={`group relative block overflow-hidden bg-paper ${t.className}`}
                >
                  {comingSoon ? (
                    <div className="absolute inset-0 bg-neutral-900 bg-gradient-to-b from-neutral-800 to-neutral-950">
                      <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
                        <span className="text-sm font-medium uppercase tracking-[0.35em] text-paper lg:text-base">
                          Очаквайте скоро
                        </span>
                        <span className="mt-3 text-xs uppercase tracking-[0.2em] text-paper/60 lg:text-sm">
                          Мъжка колекция
                        </span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Image
                        src={t.image}
                        alt={t.label}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover transition-transform duration-700 ease-editorial group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-ink/55 to-transparent" />
                    </>
                  )}
                  <div className="absolute bottom-0 left-0 flex w-full items-end justify-between p-5">
                    <span className="font-display text-2xl text-paper lg:text-3xl">{t.label}</span>
                    <ArrowUpRight
                      className="h-6 w-6 text-paper transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
                      strokeWidth={1.4}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
