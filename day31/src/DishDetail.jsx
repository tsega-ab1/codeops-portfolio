import { useContext } from "react";
import { useParams } from "react-router-dom";
import { useFetch } from "./useFetch.js";
import { CartContext } from "./CartContext.jsx";

function DishDetail() {
  const { id } = useParams();
  const { data, loading, error } = useFetch("/dishes.json");
  const { dispatch } = useContext(CartContext);

  if (loading) return <p>Loading…</p>;
  if (error) return <p className="err">{error}</p>;

  const dish = (data ?? []).find((d) => d.id === id);
  if (!dish) return <p>No dish called {id}.</p>;

  return (
    <div>
      <h2>{dish.name}</h2>
      <p>{dish.price} ETB</p>
      <p>Category: {dish.category}</p>
      <button onClick={() => dispatch({ type: "add", dish })}>
        Add to cart
      </button>
    </div>
  );
}

export default DishDetail;
