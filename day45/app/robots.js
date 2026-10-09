import { SITE_URL } from "@/lib/site";

// Crawl guidance only. Authentication is what protects these routes.
export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/cart", "/checkout", "/orders", "/kitchen", "/signin", "/api/"]
    },
    sitemap: `${SITE_URL}/sitemap.xml`
  };
}
