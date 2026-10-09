import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDish } from "@/lib/dishes";
import { SITE_URL } from "@/lib/site";
import AddToCartButton from "@/components/AddToCartButton";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const dish = await getDish(id);

  if (!dish) {
    return {
      title: "Dish not found",
      description: "The requested dish could not be found.",
      robots: { index: false }
    };
  }

  const description = `${dish.name} — ${dish.price} ETB. ${dish.summary}`;

  return {
    title: dish.name,
    description,
    alternates: { canonical: `/menu/${dish.id}` },
    // The image comes from the sibling opengraph-image.js file convention.
    openGraph: {
      title: `${dish.name} · Addis Eats`,
      description,
      url: `/menu/${dish.id}`,
      type: "website"
    }
  };
}

export default async function DishPage({ params }) {
  const { id } = await params;
  const dish = await getDish(id);

  if (!dish) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MenuItem",
    name: dish.name,
    description: dish.summary,
    url: `${SITE_URL}/menu/${dish.id}`,
    offers: { "@type": "Offer", price: dish.price, priceCurrency: "ETB" }
  };

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <h1>{dish.name}</h1>
      <Image
        src={dish.image}
        alt={dish.name}
        width={600}
        height={400}
        priority
        sizes="(max-width: 640px) 100vw, 600px"
        style={{ width: "100%", maxWidth: 600, height: "auto", borderRadius: 12 }}
      />
      <p>{dish.summary}</p>
      <p><strong>{dish.price} ETB</strong></p>
      <AddToCartButton dish={{ id: dish.id, name: dish.name, price: dish.price }} />
      <p><Link href="/menu">← Back to menu</Link></p>
    </article>
  );
}
