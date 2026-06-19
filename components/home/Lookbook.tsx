import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";

interface Tile {
  label: string;
  href: string;
  image: string;
  className: string;
}

const TILES: Tile[] = [
  {
    label: "Дамско лято",
    href: "/damsko",
    image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1100&q=80",
    className: "md:col-span-2 md:row-span-2 aspect-[3/4] md:aspect-auto",
  },
  {
    label: "Мъжко",
    href: "/muzhko",
    image: "https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=900&q=80",
    className: "aspect-[4/5]",
  },
  {
    label: "Връхни дрехи",
    href: "/novo",
    image: "https://images.unsplash.com/photo-1611312449408-fcece27cdbb7?auto=format&fit=crop&w=900&q=80",
    className: "aspect-[4/5]",
  },
  {
    label: "Нови сетове",
    href: "/novo",
    image: "https://images.unsplash.com/photo-1485231183945-fffde7cc051e?auto=format&fit=crop&w=1100&q=80",
    className: "md:col-span-2 aspect-[16/7]",
  },
];

export function Lookbook() {
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
            {TILES.map((t) => (
              <Link
                key={t.label}
                href={t.href}
                className={`group relative block overflow-hidden bg-paper ${t.className}`}
              >
                <Image
                  src={t.image}
                  alt={t.label}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover transition-transform duration-700 ease-editorial group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/55 to-transparent" />
                <div className="absolute bottom-0 left-0 flex w-full items-end justify-between p-5">
                  <span className="font-display text-2xl text-paper lg:text-3xl">{t.label}</span>
                  <ArrowUpRight
                    className="h-6 w-6 text-paper transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
                    strokeWidth={1.4}
                  />
                </div>
              </Link>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
