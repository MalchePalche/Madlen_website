import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage, Section, Bullets } from "@/components/content/ContentPage";
import { BRAND } from "@/lib/config";
import { DELIVERY_FEE } from "@/lib/orders";
import { formatBGN } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Доставка",
  description: "Информация за доставка — срокове, цени и наложен платеж.",
};

export default function DeliveryPage() {
  return (
    <ContentPage
      eyebrow="Помощ"
      title="Доставка"
      intro="Доставяме в цялата страна чрез куриер. Поръчките се обработват и изпращат възможно най-бързо, а плащането е удобно — при получаване."
    >
      <Section title="Срокове за доставка">
        <p>
          Поръчките се обработват в рамките на 24 часа в работни дни. Доставката отнема{" "}
          <strong className="font-medium text-ink">1–3 работни дни</strong> в зависимост от
          населеното място.
        </p>
        <p>
          Поръчки, направени през уикенда или в почивни дни, се обработват в следващия работен
          ден.
        </p>
      </Section>

      <Section title="Цена на доставката">
        <Bullets
          items={[
            <>
              Стандартна доставка с куриер:{" "}
              <strong className="font-medium text-ink">{formatBGN(DELIVERY_FEE)}</strong>
            </>,
            <>
              <strong className="font-medium text-ink">Безплатна доставка</strong> за поръчки над{" "}
              {BRAND.freeShippingThreshold} лв
            </>,
            <>Доставка до адрес или до офис на куриера — по ваш избор</>,
          ]}
        />
      </Section>

      <Section title="Наложен платеж">
        <p>
          Плащането се извършва <strong className="font-medium text-ink">при доставка</strong> —
          в брой на куриера, когато получите пратката. Не предлагаме онлайн плащане с карта.
        </p>
        <p>
          Преди да платите, имате право да проверите съдържанието на пратката за съответствие с
          поръчката.
        </p>
      </Section>

      <Section title="Проследяване на пратката">
        <p>
          След изпращане ще получите номер за проследяване по телефон или имейл (ако сте го
          посочили), с който можете да следите статуса на доставката.
        </p>
      </Section>

      <Section title="Въпроси?">
        <p>
          За въпроси относно доставка се свържете с нас на{" "}
          <a href={`mailto:${BRAND.email}`} className="text-ink underline underline-offset-4">
            {BRAND.email}
          </a>{" "}
          или{" "}
          <a href={`tel:${BRAND.phone.replace(/\s/g, "")}`} className="text-ink underline underline-offset-4">
            {BRAND.phone}
          </a>
          . Вижте и условията за{" "}
          <Link href="/vryshtane" className="text-ink underline underline-offset-4">
            връщане и замяна
          </Link>
          .
        </p>
      </Section>
    </ContentPage>
  );
}
