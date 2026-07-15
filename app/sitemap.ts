import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/products";

const BASE_URL = "https://noem-studio.com";

/**
 * Native Next.js 14 sitemap. Combines a fixed set of public pages with a
 * dynamic entry per product slug pulled from Supabase (falling back to the
 * local catalogue via getProducts, so the sitemap is never empty even before
 * the backend is wired up). Regenerated on each request/revalidation.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    // Collection pages — refreshed as the catalogue grows.
    { url: `${BASE_URL}/novo`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/damsko`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/muzhko`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    // Static info pages — rarely change.
    { url: `${BASE_URL}/dostavka`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/vryshtane`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/razmerna-tablica`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/kontakti`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/obshti-usloviya`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/poveritelnost`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/wishlist`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];

  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const products = await getProducts();
    productRoutes = products.map((product) => ({
      url: `${BASE_URL}/produkt/${product.slug}`,
      lastModified: product.created_at ? new Date(product.created_at) : now,
      changeFrequency: "weekly",
      priority: 0.8,
    }));
  } catch {
    // Never let a catalogue fetch failure break the whole sitemap — ship the
    // static routes so crawlers still get the core pages.
    productRoutes = [];
  }

  return [...staticRoutes, ...productRoutes];
}
