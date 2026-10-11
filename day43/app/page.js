import { dishes } from "@/lib/dishes";
import HeroImage from "@/app/_components/HeroImage";
import DishImage from "@/app/_components/DishImage";
import { dishImageSrc, publicFileExists } from "@/lib/dish-image";
import { formatETB } from "@/lib/format";

// Server Component: no "use client", so none of this ships as browser JavaScript.
export default function HomePage() {
  const hasHero = publicFileExists("/hero.jpg");

  return (
    <main className="mx-auto max-w-6xl p-6">
      {hasHero && (
        <div className="mb-8 overflow-hidden rounded-xl">
          <HeroImage />
        </div>
      )}

      <h1 className="mb-6 text-3xl font-bold">Addis Eats</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {dishes.map((dish) => (
          <article key={dish.id} className="overflow-hidden rounded-xl border bg-white shadow-sm">
            <DishImage src={dishImageSrc(dish)} alt={dish.name} />
            <div className="p-5">
              <h2 className="text-xl font-semibold">{dish.name}</h2>
              <p className="mt-2 text-gray-600">{dish.description}</p>
              <p className="mt-4 font-bold">{formatETB(dish.price)}</p>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
