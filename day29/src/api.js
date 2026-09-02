export async function fetchDishes(category, signal) {
  const url =
    category && category !== "All"
      ? `/dishes.json?category=${category}`
      : "/dishes.json";

  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error("Could not load the menu");

  const data = await res.json();

  // dishes.json is static, so filter client-side once fetched
  return category && category !== "All"
    ? data.filter((d) => d.category === category)
    : data;
}
