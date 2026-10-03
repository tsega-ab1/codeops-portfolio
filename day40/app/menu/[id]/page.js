import { notFound } from "next/navigation";
import { getDishes } from "../../../lib/dishes.js";
import AddToCartButton from "../../../components/AddToCartButton.jsx";

export async function generateStaticParams() {
  const dishes = await getDishes();
  return dishes.map((dish) => ({ id: dish.id }));
}

export default async function DishPage({ params }) {
  const { id } = await params;
  const dishes = await getDishes();
  const dish = dishes.find((d) => d.id === id);

  if (!dish) {
    notFound();
  }

  return (
    <main className="dish-detail">
      <div className="dish-detail-card">
        <div className="dish-image">{dish.emoji}</div>
        <h1>{dish.name}</h1>
        <p className="dish-description">{dish.description}</p>
        <p className="dish-detail-price">{dish.price} ETB</p>
        <AddToCartButton dishId={dish.id} />
      </div>
    </main>
  );
}
