import type { Metadata } from "next";
import { Collection } from "@/components/collection/Collection";
import type { SearchParams } from "@/lib/filters";

export const metadata: Metadata = {
  title: "Мъжко",
  description: "Мъжко облекло — минимални силуети в естествени тъкани.",
};

export default function MuzhkoPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Collection
      eyebrow="Колекция"
      title="Мъжко"
      description="Минимални силуети в лен, памук и вълна — създадени за всеки ден."
      base={{ gender: "male" }}
      basePath="/muzhko"
      searchParams={searchParams}
    />
  );
}
