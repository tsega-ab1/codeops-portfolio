"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { useDebounce } from "./useDebounce";

const categories = ["All", "Tibs", "Traditional", "Vegetarian", "Pasta", "Burger", "Pizza"];

export default function SearchBox() {
  const [term, setTerm] = useState("");
  const [category, setCategory] = useState("All");
  const debouncedTerm = useDebounce(term, 300);

  const params = new URLSearchParams();
  if (debouncedTerm) params.set("q", debouncedTerm);
  if (category !== "All") params.set("category", category);
  const qs = params.toString();
  const key = qs ? `/api/dishes?${qs}` : "/api/dishes";

  const { data, error, isLoading } = useSWR(key, fetcher, {
    keepPreviousData: true,
  });

  return (
    <section>
      <div className="mb-6 flex flex-col gap-3 md:flex-row">
        <div className="flex-1">
          <label htmlFor="search" className="mb-2 block font-medium">
            Search dishes
          </label>
          <input
            id="search"
            type="text"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search for tibs, kitfo..."
            className="w-full rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div>
          <label htmlFor="category" className="mb-2 block font-medium">
            Category
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border px-4 py-3"
          >
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="text-red-600">Could not load dishes.</p>}
      {!error && isLoading && !data && <p>Loading dishes...</p>}

      {data && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data.data.map((dish) => (
            <article key={dish.id} className="rounded-xl border bg-white p-5 shadow-sm">
              <h2 className="text-xl font-semibold">{dish.name}</h2>
              <p className="mt-2 text-gray-600">{dish.description}</p>
              <p className="mt-4 font-bold">{dish.price} ETB</p>
            </article>
          ))}
        </div>
      )}

      {data?.data.length === 0 && <p className="text-gray-600">No dishes found.</p>}
    </section>
  );
}
