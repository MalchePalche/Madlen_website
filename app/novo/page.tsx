import type { Metadata } from "next";
import { Collection } from "@/components/collection/Collection";
import type { SearchParams } from "@/lib/filters";

export const metadata: Metadata = {
  title: { absolute: "Нови продукти | Noem Studio" },
  description: "Последните новости от Noem Studio. Нови дрехи добавяни редовно.",
};

export default function NovoPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Collection
      eyebrow="Нови продукти"
      title="Ново"
      description="Най-новите попълнения — мъжко и дамско, подредени по дата на добавяне."
      base={{ isNew: true }}
      basePath="/novo"
      searchParams={searchParams}
    />
  );
}
