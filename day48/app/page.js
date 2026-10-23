import Link from "next/link";
import { SITE_URL } from "@/lib/site";

export const metadata = { alternates: { canonical: "/" } };

export default function HomePage() {
  // Describes only what is really on the page. No ratings, prices or reviews.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: "Addis Eats",
    description: "Ethiopian food delivery in Addis Ababa.",
    url: SITE_URL,
    servesCuisine: "Ethiopian",
    areaServed: "Addis Ababa"
  };

  return (
    <section>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <h1>Welcome to Addis Eats</h1>
      <p>Discover Ethiopian food in Addis Ababa.</p>
      <p><Link href="/menu">Browse the menu</Link></p>
    </section>
  );
}
