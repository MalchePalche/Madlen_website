import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { getProductBySlug, getRelatedProducts } from "@/lib/products";
import { ProductGallery } from "@/components/product/ProductGallery";
import { BuyPanel } from "@/components/product/BuyPanel";
import { RelatedProducts } from "@/components/product/RelatedProducts";

function genderRoute(gender: string) {
  if (gender === "male") return { href: "/muzhko", label: "Мъжко" };
  if (gender === "female") return { href: "/damsko", label: "Дамско" };
  return { href: "/novo", label: "Ново" };
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);
  if (!product) return { title: "Продуктът не е намерен" };
  return {
    title: product.name_bg,
    description: product.description_bg ?? product.material_bg ?? product.name_bg,
    openGraph: { title: product.name_bg, images: product.images.slice(0, 1) },
  };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await getProductBySlug(params.slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product, 4);
  const gender = genderRoute(product.gender);

  return (
    <article className="gutter mx-auto max-w-edge pb-20 pt-6 lg:pt-8">
      {/* breadcrumb */}
      <nav aria-label="Навигация" className="flex min-w-0 items-center gap-1.5 text-[0.74rem] text-ash">
        <Link href="/" className="shrink-0 whitespace-nowrap hover:text-ink">
          Начало
        </Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
        <Link href={gender.href} className="shrink-0 whitespace-nowrap hover:text-ink">
          {gender.label}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
        <span className="min-w-0 truncate text-ink">{product.name_bg}</span>
      </nav>

      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-12">
        <ProductGallery images={product.images} alt={product.name_bg} />
        <BuyPanel product={product} />
      </div>

      <RelatedProducts products={related} />
    </article>
  );
}
