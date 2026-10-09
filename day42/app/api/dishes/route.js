import { dishes } from "@/lib/dishes";

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const query = searchParams.get("q")?.trim().toLowerCase() || "";
  const category = searchParams.get("category")?.trim().toLowerCase() || "";
  const page = Number(searchParams.get("page") || 1);
  const limit = 3;

  const filteredDishes = dishes.filter((dish) => {
    const matchesQuery = query ? dish.name.toLowerCase().includes(query) : true;
    const matchesCategory = category
      ? dish.category.toLowerCase() === category
      : true;
    return matchesQuery && matchesCategory;
  });

  const start = (page - 1) * limit;
  const results = filteredDishes.slice(start, start + limit);

  return Response.json({
    data: results,
    page,
    limit,
    total: filteredDishes.length,
    totalPages: Math.ceil(filteredDishes.length / limit),
  });
}
