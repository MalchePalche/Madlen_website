import type { Metadata } from "next";
import { Collection } from "@/components/collection/Collection";
import type { SearchParams } from "@/lib/filters";

export const metadata: Metadata = {
  title: { absolute: "Намаления | Noem Studio" },
  description:
    "Актуалните промоции на Noem Studio — избрани артикули с намалени цени, докато складът позволява.",
};

export default function NamaleniaPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Collection
      eyebrow="Промоции"
      title="Намаления"
      description="Избрани артикули на намалени цени — само докато складът позволява."
      base={{ onSale: true }}
      basePath="/namalenia"
      searchParams={searchParams}
    />
  );
}
