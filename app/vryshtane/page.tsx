import type { Metadata } from "next";
import { ContentPage, Section, Bullets } from "@/components/content/ContentPage";
import { BRAND } from "@/lib/config";

export const metadata: Metadata = {
  title: "Връщане и замяна",
  description: "14-дневно право на връщане, условия и стъпки за връщане или замяна.",
};

export default function ReturnsPage() {
  return (
    <ContentPage
      eyebrow="Помощ"
      title="Връщане и замяна"
      intro="Искаме да сте напълно доволни от поръчката си. Ако нещо не е както очаквате, можете да го върнете или замените при следните условия."
    >
      <Section title="14-дневно право на връщане">
        <p>
          Имате право да върнете закупен продукт в срок до{" "}
          <strong className="font-medium text-ink">14 дни</strong> от получаването, без да
          посочвате причина, съгласно Закона за защита на потребителите.
        </p>
      </Section>

      <Section title="Условия за връщане">
        <p>За да бъде прието връщането, продуктът трябва да е:</p>
        <Bullets
          items={[
            "неизползван и неносен, без следи от употреба;",
            "с оригиналните етикети и опаковка;",
            "в търговски вид, годен за последваща продажба.",
          ]}
        />
        <p className="text-ash">
          По хигиенни причини не приемаме връщане на бельо и обеци, освен ако опаковката е
          неотворена.
        </p>
      </Section>

      <Section title="Как да върнете продукт">
        <ol className="space-y-2">
          {[
            <>
              Свържете се с нас на{" "}
              <a href={`mailto:${BRAND.email}`} className="text-ink underline underline-offset-4">
                {BRAND.email}
              </a>{" "}
              или{" "}
              <a href={`tel:${BRAND.phone.replace(/\s/g, "")}`} className="text-ink underline underline-offset-4">
                {BRAND.phone}
              </a>{" "}
              и посочете номера на поръчката.
            </>,
            "Опаковайте продукта заедно с касовата бележка / фактурата.",
            "Изпратете пратката с куриер Еконт до наш офис на Еконт. Транспортните разходи за връщане са за сметка на клиента.",
            "След като получим и проверим продукта, ще обработим връщането.",
          ].map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="font-display text-lg leading-none text-ink">{i + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Замяна на размер или цвят">
        <p>
          Ако желаете друг размер или цвят, свържете се с нас — ще организираме замяна според
          наличността. При замяна изпращате върнатия продукт и получавате новия с следващата
          доставка.
        </p>
      </Section>

      <Section title="Възстановяване на сумата">
        <p>
          Тъй като плащането е с наложен платеж, възстановяването се извършва по{" "}
          <strong className="font-medium text-ink">банков път</strong> в срок до 14 дни след
          като получим върнатия продукт. За целта ще е необходим IBAN.
        </p>
      </Section>

      <Section title="Връщане чрез Еконт">
        <p>
          Връщанията се обработват чрез куриер{" "}
          <strong className="font-medium text-ink">Еконт</strong>. Изпратете продукта до наш
          офис на Еконт, като посочите номера на поръчката.
        </p>
        <p>
          Ако сте получили сгрешен или дефектен артикул, изпратете пратката с{" "}
          <strong className="font-medium text-ink">наложен платеж обратно</strong> — така
          разходите за обратната доставка са за наша сметка.
        </p>
      </Section>
    </ContentPage>
  );
}
