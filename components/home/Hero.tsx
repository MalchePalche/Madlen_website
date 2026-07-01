import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BRAND } from "@/lib/config";

export function Hero() {
  return (
    <section className="relative h-[88vh] min-h-[560px] w-full overflow-hidden bg-mist">
      {/* mobile — autoplaying, muted, looping video background */}
      <video
        className="absolute inset-0 block h-full w-full object-cover md:hidden"
        src="/Hero_mobile_final.mp4"
        poster="/hero-mobile-poster.jpg"
        autoPlay
        muted
        loop
        playsInline
      />

      {/* desktop — autoplaying, muted, looping video background */}
      <video
        className="hidden md:block w-full h-full object-cover absolute inset-0"
        src="/hero_desktop_clean.mp4"
        poster="/hero-desktop-poster.jpg"
        autoPlay
        muted
        loop
        playsInline
      />
      {/* readability scrim — bottom-weighted, never a flat overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/55 via-ink/10 to-ink/15" />

      {/* vertical season label — signature editorial detail */}
      <span className="absolute left-6 top-1/2 hidden -translate-y-1/2 -rotate-90 text-[0.7rem] uppercase tracking-widest3 text-paper/80 lg:block">
        {BRAND.season} · Колекция
      </span>

      <div className="gutter relative z-10 mx-auto flex h-full max-w-edge flex-col justify-end pb-14 lg:pb-20">
        <div className="max-w-2xl animate-fade-up text-paper">
          <p className="eyebrow text-paper/75">Нова колекция</p>
          <h1 className="mt-4 font-display text-[2.6rem] leading-[0.98] sm:text-6xl lg:text-7xl">
            Лято в естествени
            <br />
            тъкани
          </h1>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-paper/85 sm:text-base">
            Минималистични силуети, лен и памук. Създадено за всеки ден — мъжко и дамско облекло.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/damsko" className="btn-noir bg-paper text-ink hover:bg-paper/85 hover:text-ink">
              Към колекцията <ArrowRight className="h-4 w-4" strokeWidth={1.6} />
            </Link>
            <Link
              href="/muzhko"
              className="btn-outline border-paper text-paper hover:bg-paper hover:text-ink"
            >
              Мъжко
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
