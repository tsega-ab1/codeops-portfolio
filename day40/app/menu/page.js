import CategoryFilter from "../../components/CategoryFilter.jsx";
import { getDishes } from "../../lib/dishes.js";

export default async function MenuPage({ searchParams }) {
  const dishes = await getDishes();
  const { category } = await searchParams;

  return (
    <div>
      <h1 className="page-title">Our Menu</h1>
      <CategoryFilter dishes={dishes} initialCategory={category ?? "All"} />
    </div>
  );
}
