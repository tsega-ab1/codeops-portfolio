import { Suspense } from "react";
import Link from "next/link";
import DishSkeleton from "../../components/DishSkeleton";
import { getDishes } from "../../lib/dishes.js";
import { simulateMenuPriceUpdate } from "../../lib/actions.js";

async function DishList() {
  const dishes = await getDishes();

  return (
    <div className="dish-grid">
      {dishes.map((dish) => (
        <Link href={`/menu/${dish.id}`} className="dish-card" key={dish.id}>
          <div className="dish-image">{dish.emoji}</div>
          <div className="dish-content">
            <h2>{dish.name}</h2>
            <p className="dish-description">{dish.description}</p>
            <p className="dish-price">{dish.price} ETB</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function MenuPage() {
  return (
    <div>
      <h1 className="page-title">Our Menu</h1>
      <p className="page-description">
        Choose from our selection of delicious dishes.
      </p>

      <Suspense fallback={<DishSkeleton />}>
        <DishList />
      </Suspense>

      <form action={simulateMenuPriceUpdate} style={{ marginTop: "30px" }}>
        <button className="primary-button" type="submit">
          Simulate price update (Day 37 demo)
        </button>
      </form>
    </div>
  );
}
