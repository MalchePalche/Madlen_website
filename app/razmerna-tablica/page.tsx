import type { Metadata } from "next";
import { ContentPage, Section, Bullets } from "@/components/content/ContentPage";

export const metadata: Metadata = {
  title: "Размерна таблица",
  description: "Размери в сантиметри за бюст, талия и ханш — дамски и мъжки.",
};

const WOMEN = {
  head: ["Размер", "Бюст (см)", "Талия (см)", "Ханш (см)"],
  rows: [
    ["XS", "80–84", "60–64", "86–90"],
    ["S", "84–88", "64–68", "90–94"],
    ["M", "88–92", "68–72", "94–98"],
    ["L", "92–97", "72–78", "98–104"],
    ["XL", "97–102", "78–84", "104–110"],
  ],
};

const MEN = {
  head: ["Размер", "Гръдна обиколка (см)", "Талия (см)"],
  rows: [
    ["XS", "86–90", "74–78"],
    ["S", "90–96", "78–84"],
    ["M", "96–102", "84–90"],
    ["L", "102–108", "90–96"],
    ["XL", "108–114", "96–104"],
  ],
};

function SizeTable({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-ink">
            {head.map((h) => (
              <th
                key={h}
                scope="col"
                className="py-3 pr-4 text-left text-[0.7rem] uppercase tracking-widest2 font-semibold"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[0]} className="border-b border-hairline">
              {row.map((cell, i) => (
                <td
                  key={i}
                  className={i === 0 ? "py-3 pr-4 font-medium" : "py-3 pr-4 tabular-nums text-ink/80"}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SizeGuidePage() {
  return (
    <ContentPage
      eyebrow="Помощ"
      title="Размерна таблица"
      intro="Намерете своя размер по телесни мерки. Стойностите са в сантиметри и са ориентировъчни — кройката може да варира леко според модела."
    >
      <Section title="Дамски размери">
        <SizeTable head={WOMEN.head} rows={WOMEN.rows} />
      </Section>

      <Section title="Мъжки размери">
        <SizeTable head={MEN.head} rows={MEN.rows} />
      </Section>

      <Section title="Как да се измерите">
        <Bullets
          items={[
            <>
              <strong className="font-medium text-ink">Бюст / гръдна обиколка:</strong> измерете
              около най-широката част на гръдния кош.
            </>,
            <>
              <strong className="font-medium text-ink">Талия:</strong> измерете около най-тясната
              част на талията.
            </>,
            <>
              <strong className="font-medium text-ink">Ханш:</strong> измерете около най-широката
              част на бедрата.
            </>,
            "Използвайте мек шивашки метър и не го пристягайте — дръжте го хоризонтално и плътно, но не стегнато.",
          ]}
        />
        <p className="text-ash">
          Ако сте между два размера, препоръчваме да изберете по-големия за по-свободна кройка.
        </p>
      </Section>
    </ContentPage>
  );
}
