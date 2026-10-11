"use client";

import { useQuery } from "@tanstack/react-query";
import AddToCartButton from "./AddToCartButton";

async function getDishes() {
  const response = await fetch("/api/dishes");
  if (!response.ok) throw new Error("Failed to fetch dishes");
  return response.json();
}

export default function TanStackMenu() {
  const { data, error, isPending } = useQuery({
    queryKey: ["dishes"],
    queryFn: getDishes,
    staleTime: 5 * 60 * 1000, // a menu rarely changes
  });

  if (isPending) return <p>Loading menu...</p>;
  if (error) return <p>Could not load menu.</p>;

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {data.data.map((dish) => (
        <article key={dish.id} className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold">{dish.name}</h2>
          <p className="mt-2 text-gray-600">{dish.description}</p>
          <p className="mt-4 font-bold">{dish.price} ETB</p>
          <AddToCartButton dish={dish} />
        </article>
      ))}
    </div>
  );
}
