import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { getProductBySlug, getRelatedProducts } from "@/lib/products";
import { ProductGallery } from "@/components/product/ProductGallery";
import { BuyPanel } from "@/components/product/BuyPanel";
import { ProductReviews } from "@/components/product/ProductReviews";
import { RelatedProducts } from "@/components/product/RelatedProducts";

// No generateStaticParams here: every slug is resolved on demand, so products
// added to Supabase after the build (e.g. the Instagram import) render fine.
// This is already the App Router default — declared explicitly so that adding
// generateStaticParams later can't silently start 404-ing unknown slugs.
export const dynamicParams = true;

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

  // Meta description: prefer the product description, stripped of any HTML and
  // clamped to 155 characters so it renders cleanly in search results.
  const description = (product.description_bg ?? product.material_bg ?? product.name_bg)
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 155);
  const ogImage = product.images[0] || "/logo.png";

  return {
    title: { absolute: `${product.name_bg} | Noem Studio` },
    description,
    openGraph: {
      title: product.name_bg,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: product.name_bg }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: product.name_bg,
      description,
      images: [ogImage],
    },
  };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await getProductBySlug(params.slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product, 4);
  const gender = genderRoute(product.gender);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name_bg,
    description: product.description_bg ?? product.material_bg ?? product.name_bg,
    image: [product.images[0] || "https://noem-studio.com/logo.png"],
    brand: {
      "@type": "Brand",
      name: "Noem Studio",
    },
    offers: {
      "@type": "Offer",
      url: `https://noem-studio.com/produkt/${product.slug}`,
      priceCurrency: "EUR",
      price: String(product.price_bgn),
      availability:
        product.stock === 0
          ? "https://schema.org/OutOfStock"
          : "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: "Noem Studio",
      },
    },
  };

  return (
    <article className="gutter mx-auto max-w-edge pb-20 pt-6 lg:pt-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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

      <ProductReviews productId={product.id} />

      <RelatedProducts products={related} />
    </article>
  );
}
