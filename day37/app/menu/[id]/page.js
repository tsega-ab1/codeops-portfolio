import { getDishes } from "../../../lib/dishes.js";
import { addToCart } from "../../../lib/actions.js";

export async function generateStaticParams() {
  const dishes = await getDishes();
  return dishes.map((dish) => ({ id: dish.id }));
}

export default async function DishPage({ params }) {
  const { id } = await params;
  const dishes = await getDishes();
  const dish = dishes.find((d) => d.id === id);

  if (!dish) {
    return (
      <div className="dish-detail">
        <h1>Dish not found</h1>
      </div>
    );
  }

  return (
    <main className="dish-detail">
      <div className="dish-detail-card">
        <div className="dish-image">{dish.emoji}</div>
        <h1>{dish.name}</h1>
        <p className="dish-description">{dish.description}</p>
        <p className="dish-detail-price">{dish.price} ETB</p>
        <form action={addToCart}>
          <button className="primary-button" type="submit">
            Add to Cart
          </button>
        </form>
      </div>
    </main>
  );
}
