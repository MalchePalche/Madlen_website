import type { MetadataRoute } from "next";

/**
 * Native Next.js 14 robots.txt. Crawlers may index all public pages; the admin
 * dashboard, API routes and the personal account area are kept out of the index.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api", "/akaunt"],
    },
    sitemap: "https://noem-studio.com/sitemap.xml",
  };
}
