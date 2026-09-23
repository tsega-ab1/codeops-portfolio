import { notFound } from "next/navigation";
import { dishes } from "../dishes.js";

export default function DishPage({ params }) {
  const { id } = params;
  const dish = dishes.find((d) => d.id === id);

  if (!dish) {
    notFound();
  }

  return (
    <div>
      <h2 className="text-xl font-semibold">{dish.name}</h2>
      <p>{dish.price} ETB</p>
      <p>Category: {dish.category}</p>
    </div>
  );
}
