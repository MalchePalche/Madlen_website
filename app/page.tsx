import type { Metadata } from "next";
import { Hero } from "@/components/home/Hero";
import { NewArrivals } from "@/components/home/NewArrivals";
import { Lookbook } from "@/components/home/Lookbook";
import { CategoryPills } from "@/components/home/CategoryPills";
import { getNewArrivals } from "@/lib/products";

export const metadata: Metadata = {
  openGraph: {
    title: "Noem Studio — Дамска мода онлайн",
    description: "Открийте новата колекция на Noem Studio.",
    url: "https://noem-studio.com",
    siteName: "Noem Studio",
    images: [
      {
        url: "https://noem-studio.com/logo.png",
        width: 1200,
        height: 630,
        alt: "Noem Studio",
      },
    ],
    type: "website",
  },
};

export default async function HomePage() {
  const newArrivals = await getNewArrivals(8);

  return (
    <>
      <Hero />
      <NewArrivals products={newArrivals} />
      <Lookbook />
      <CategoryPills />
    </>
  );
}
