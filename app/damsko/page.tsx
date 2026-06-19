import type { Metadata } from "next";
import { Collection } from "@/components/collection/Collection";
import type { SearchParams } from "@/lib/filters";

export const metadata: Metadata = {
  title: "Дамско",
  description: "Дамско облекло за всеки ден и специални поводи.",
};

export default function DamskoPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Collection
      eyebrow="Колекция"
      title="Дамско"
      description="Рокли, топове и връхни дрехи в естествени тъкани и чисти линии."
      base={{ gender: "female" }}
      basePath="/damsko"
      searchParams={searchParams}
    />
  );
}
