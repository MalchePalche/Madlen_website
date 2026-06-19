import { Hero } from "@/components/home/Hero";
import { NewArrivals } from "@/components/home/NewArrivals";
import { Lookbook } from "@/components/home/Lookbook";
import { CategoryPills } from "@/components/home/CategoryPills";
import { getNewArrivals } from "@/lib/products";

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
