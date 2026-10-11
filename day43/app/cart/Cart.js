"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

export default function Cart() {
  const { data, error, isLoading, mutate } = useSWR("/api/cart", fetcher);

  if (isLoading) return <p>Loading cart...</p>;
  if (error) return <p>Could not load cart.</p>;

  async function addDish(dish) {
    await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dish),
    });
    mutate();
  }

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">Cart</h1>
      <div className="space-y-4">
        {data.map((dish, i) => (
          <div key={i} className="rounded-lg border p-4">{dish.name}</div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => addDish({ id: 99, name: "Special Tibs" })}
        className="mt-6 rounded-lg bg-purple-600 px-4 py-2 text-white"
      >
        Add Special Tibs
      </button>
    </div>
  );
}
