"use client";

import { useState } from "react";
import useSWR from "swr";
import DishCard from "./DishCard";
import { useDebounce } from "@/app/menu/useDebounce";

const fetcher = async (url) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Request failed");
  return response.json();
};

// The first page arrives from the server (initialData), so there is no spinner
// and no request until the person searches or changes page.
export default function MenuBrowser({ initialData }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const q = useDebounce(search.trim(), 300);
  const isInitial = !q && page === 1;

  // null key = SWR makes no request
  const key = isInitial ? null : `/api/dishes?${new URLSearchParams({ q, page: String(page) })}`;

  const { data, error, isLoading } = useSWR(key, fetcher, { keepPreviousData: true });

  const view = isInitial ? initialData : (data ?? initialData);
  const waiting = isLoading || search.trim() !== q;

  return (
    <section>
      <label>
        <span className="muted">Search dishes </span>
        <input
          type="search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Try kitfo"
        />
      </label>

      <p className="muted" aria-live="polite">
        {error ? "Search failed. Try again." : waiting ? "Searching…" : `${view.total} dishes`}
      </p>

      {view.items.length === 0 ? (
        <p>No dishes match “{q}”.</p>
      ) : (
        <ul className="grid">
          {view.items.map((dish, index) => (
            <DishCard key={dish.id} dish={dish} priority={index === 0 && page === 1} />
          ))}
        </ul>
      )}

      <p>
        <button onClick={() => setPage((p) => p - 1)} disabled={view.page <= 1}>Previous</button>{" "}
        <span className="muted">Page {view.page} of {view.pages}</span>{" "}
        <button onClick={() => setPage((p) => p + 1)} disabled={view.page >= view.pages}>Next</button>
      </p>
    </section>
  );
}
