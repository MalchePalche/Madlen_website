import Link from "next/link";
import { Instagram, Facebook } from "lucide-react";
import { BRAND, FOOTER_LINKS } from "@/lib/config";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-hairline bg-mist">
      <div className="gutter mx-auto max-w-edge py-16">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_3fr]">
          {/* brand block */}
          <div>
            <Link
              href="/"
              className="font-display text-3xl tracking-[0.3em]"
              aria-label={`${BRAND.name} — начало`}
            >
              {BRAND.name}
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ash">
              {BRAND.tagline}. Минимализъм, естествени тъкани и грижа към детайла.
            </p>
            <div className="mt-6 flex gap-3">
              <a
                href={BRAND.social.instagram}
                aria-label="Instagram"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center border border-ink transition-colors hover:bg-ink hover:text-paper"
              >
                <Instagram className="h-4 w-4" strokeWidth={1.5} />
              </a>
              <a
                href={BRAND.social.facebook}
                aria-label="Facebook"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center border border-ink transition-colors hover:bg-ink hover:text-paper"
              >
                <Facebook className="h-4 w-4" strokeWidth={1.5} />
              </a>
            </div>
          </div>

          {/* link columns + stores */}
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
            {FOOTER_LINKS.map((col) => (
              <div key={col.title}>
                <h3 className="eyebrow mb-4">{col.title}</h3>
                <ul className="space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link
                        href={l.href}
                        className="text-sm text-ash transition-colors hover:text-ink"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div>
              <h3 className="eyebrow mb-4">Магазини</h3>
              <ul className="space-y-4">
                {BRAND.stores.map((s) => (
                  <li key={s.city} className="text-sm text-ash">
                    <span className="block font-medium text-ink">{s.city}</span>
                    {s.address}
                    <span className="mt-0.5 block text-[0.78rem]">{s.hours}</span>
                  </li>
                ))}
                <li className="text-sm">
                  <a href={`mailto:${BRAND.email}`} className="text-ash hover:text-ink">
                    {BRAND.email}
                  </a>
                  <br />
                  <a href={`tel:${BRAND.phone.replace(/\s/g, "")}`} className="text-ash hover:text-ink">
                    {BRAND.phone}
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-hairline pt-6 text-[0.72rem] text-ash sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {BRAND.name}. Всички права запазени.
          </p>
          <p className="flex gap-5">
            <Link href="/usloviya" className="hover:text-ink">
              Общи условия
            </Link>
            <Link href="/poveritelnost" className="hover:text-ink">
              Поверителност
            </Link>
            <span>Плащане: Наложен платеж</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
