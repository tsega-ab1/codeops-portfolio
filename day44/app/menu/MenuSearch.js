"use client";

import { useState } from "react";

export default function MenuSearch({ dishes }) {
  const [query, setQuery] = useState("");

  const filtered = dishes.filter((dish) =>
    dish.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search dishes"
        aria-label="Search dishes"
      />
      <ul>
        {filtered.map((dish) => (
          <li key={dish.id}>
            <a href={`/menu/${dish.id}`}>{dish.name}</a> — {dish.price} ETB
          </li>
        ))}
      </ul>
    </>
  );
}
