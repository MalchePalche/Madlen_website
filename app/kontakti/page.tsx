import type { Metadata } from "next";
import { Mail, Phone, Instagram, Facebook } from "lucide-react";
import { BRAND } from "@/lib/config";
import { ContactForm } from "@/components/contact/ContactForm";
import { Reveal } from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "Контакти",
  description: "Свържете се с нас — телефон, имейл и форма за запитване.",
};

export default function ContactPage() {
  return (
    <div className="gutter mx-auto max-w-5xl pb-24 pt-10 lg:pt-14">
      <Reveal>
        <p className="eyebrow">Помощ</p>
        <h1 className="mt-3 font-display text-4xl lg:text-5xl">Контакти</h1>
        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-ink/75">
          Имате въпрос за поръчка, размер или наличност? Пишете ни — отговаряме в рамките на един
          работен ден.
        </p>
      </Reveal>

      <div className="mt-12 grid gap-12 lg:grid-cols-2 lg:gap-16">
        {/* contact info */}
        <Reveal className="space-y-8">
          <div className="space-y-4">
            <a href={`mailto:${BRAND.email}`} className="flex items-center gap-3 text-sm hover:opacity-70">
              <Mail className="h-4 w-4 text-ash" strokeWidth={1.5} /> {BRAND.email}
            </a>
            <a href={`tel:${BRAND.phone.replace(/\s/g, "")}`} className="flex items-center gap-3 text-sm hover:opacity-70">
              <Phone className="h-4 w-4 text-ash" strokeWidth={1.5} /> {BRAND.phone}
            </a>
          </div>

          <div>
            <h2 className="eyebrow mb-4">Последвайте ни</h2>
            <div className="flex gap-3">
              <a
                href={BRAND.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="flex h-9 w-9 items-center justify-center border border-ink transition-colors hover:bg-ink hover:text-paper"
              >
                <Instagram className="h-4 w-4" strokeWidth={1.5} />
              </a>
              <a
                href={BRAND.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="flex h-9 w-9 items-center justify-center border border-ink transition-colors hover:bg-ink hover:text-paper"
              >
                <Facebook className="h-4 w-4" strokeWidth={1.5} />
              </a>
            </div>
          </div>
        </Reveal>

        {/* form */}
        <Reveal delay={0.05}>
          <h2 className="text-[0.8rem] uppercase tracking-widest2 font-semibold">Изпратете запитване</h2>
          <div className="mt-5">
            <ContactForm />
          </div>
        </Reveal>
      </div>
    </div>
  );
}
