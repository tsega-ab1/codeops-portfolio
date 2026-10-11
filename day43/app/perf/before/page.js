import { dishes } from "@/lib/dishes";
import { dishImageSrc, publicFileExists } from "@/lib/dish-image";

// DELIBERATELY UNOPTIMISED copy of the home page — the "before" for PERF.md.
// Plain <img>, no width/height, no sizes, no lazy loading, original full-size files.
export default function BeforePage() {
  const hasHero = publicFileExists("/hero.jpg");

  return (
    <main className="mx-auto max-w-6xl p-6">
      {/* eslint-disable @next/next/no-img-element */}
      {hasHero && <img src="/hero.jpg" alt="Traditional Ethiopian food served at Addis Eats" />}

      <h1 className="mb-6 text-3xl font-bold">Addis Eats (before optimisation)</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {dishes.map((dish) => (
          <article key={dish.id} className="rounded-xl border bg-white shadow-sm">
            <img src={dishImageSrc(dish)} alt={dish.name} loading="eager" />
            <div className="p-5">
              <h2 className="text-xl font-semibold">{dish.name}</h2>
              <p className="mt-2 text-gray-600">{dish.description}</p>
              <p className="mt-4 font-bold">{dish.price} ETB</p>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
