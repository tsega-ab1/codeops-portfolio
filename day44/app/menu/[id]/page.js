import { notFound } from "next/navigation";
import { getDish, getDishes } from "../../lib/dishes";

export async function generateStaticParams() {
  const dishes = await getDishes();
  return dishes.map((dish) => ({ id: dish.id }));
}

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
    // No `images` here on purpose: the sibling opengraph-image.js
    // file convention supplies a generated, absolute-URL image.
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

  if (!dish) {
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MenuItem",
    name: dish.name,
    description: dish.summary,
    offers: {
      "@type": "Offer",
      price: dish.price,
      priceCurrency: "ETB"
    }
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c")
        }}
      />
      <article>
        <h1>{dish.name}</h1>
        <p>{dish.summary}</p>
        <p>{dish.price} ETB</p>
      </article>
      <p><a href="/menu">← Back to menu</a></p>
    </main>
  );
}
