import { useState } from "react";
import { useParams } from "react-router-dom";
import { useFetch } from "./useFetch.js";
import { useCartStore } from "./cartStore.js";

function DishDetail() {
  const { id } = useParams();
  const { data, loading, error } = useFetch("/dishes.json");
  const addItem = useCartStore((s) => s.addItem);

  // Deliberate crash switch — proves the boundary catches a real render
  // error without a real bug. See Day 34's "throw deliberately" exercise.
  const [crash, setCrash] = useState(false);
  if (crash) {
    throw new Error("Deliberate crash for the Day 34 error boundary demo");
  }

  if (loading) return <p>Loading…</p>;
  if (error) return <p className="err">{error}</p>;

  const dish = (data ?? []).find((d) => d.id === id);
  if (!dish) return <p>No dish called {id}.</p>;

  return (
    <div>
      <h2>{dish.name}</h2>
      <p>{dish.price} ETB</p>
      <p>Category: {dish.category}</p>
      <button onClick={() => addItem(dish)}>Add to cart</button>
      <button onClick={() => setCrash(true)} style={{ background: "#888" }}>
        💥 Simulate crash (Day 34 demo)
      </button>
    </div>
  );
}

export default DishDetail;
