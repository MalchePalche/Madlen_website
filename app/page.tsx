import type { Metadata } from "next";
import { Hero } from "@/components/home/Hero";
import { NewArrivals } from "@/components/home/NewArrivals";
import { Sale } from "@/components/home/Sale";
// Lookbook is temporarily hidden per client request (2026-07) — see below.
// import { Lookbook } from "@/components/home/Lookbook";
import { CategoryPills } from "@/components/home/CategoryPills";
import { getNewArrivals, getSaleProducts } from "@/lib/products";

export const metadata: Metadata = {
  // `absolute` opts out of the root layout's `%s · Noem Studio` template so the
  // homepage title reads exactly as intended.
  title: { absolute: "Noem Studio — Дамска мода онлайн" },
  description:
    "Открийте новата колекция на Noem Studio. Дамски рокли, сетове, блузи и костюми с безплатна доставка над 100€.",
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
  const [newArrivals, saleProducts] = await Promise.all([
    getNewArrivals(8),
    getSaleProducts(8),
  ]);

  return (
    <>
      <Hero />
      <NewArrivals products={newArrivals} />
      {/* Sale rail — only rendered when something is actually discounted, so the
          homepage never shows an empty "Намаления" block. */}
      {saleProducts.length > 0 && <Sale products={saleProducts} />}
      {/* Lookbook hidden per client request (2026-07). Restore by uncommenting
          this and the import above — component + data are untouched. */}
      {/* <Lookbook /> */}
      <CategoryPills />
    </>
  );
}
