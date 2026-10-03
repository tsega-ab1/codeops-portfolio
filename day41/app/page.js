import { dishes } from "@/lib/dishes";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="mb-6 text-3xl font-bold">Addis Eats</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {dishes.map((dish) => (
          <article key={dish.id} className="rounded-xl border bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold">{dish.name}</h2>
            <p className="mt-2 text-gray-600">{dish.description}</p>
            <p className="mt-4 font-bold">{dish.price} ETB</p>
          </article>
        ))}
      </div>
    </main>
  );
}
