import type { Metadata } from "next";
import Link from "next/link";
import { Instagram } from "lucide-react";
import { BRAND } from "@/lib/config";
import { Reveal } from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "Мъжко — Очаквайте скоро",
  description: `Мъжката колекция на ${BRAND.name} предстои. Следете ни за новини.`,
};

export default function MuzhkoPage() {
  return (
    <div className="gutter mx-auto flex min-h-[68vh] max-w-2xl flex-col items-center justify-center py-24 text-center lg:py-32">
      <Reveal>
        <p className="eyebrow">Мъжка колекция</p>
        <h1 className="mt-5 font-display text-5xl leading-[0.95] lg:text-7xl">
          Очаквайте
          <br />
          скоро
        </h1>
        <p className="mx-auto mt-7 max-w-md text-sm leading-relaxed text-ink/75">
          Мъжката колекция на {BRAND.name} предстои. Следете ни за новини.
        </p>

        <div className="mt-10 flex flex-col items-center gap-6">
          <Link href="/" className="btn-noir">
            Към началото
          </Link>

          <a
            href={BRAND.social.instagram}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="flex h-9 w-9 items-center justify-center border border-ink transition-colors hover:bg-ink hover:text-paper"
          >
            <Instagram className="h-4 w-4" strokeWidth={1.5} />
          </a>
        </div>
      </Reveal>
    </div>
  );
}
