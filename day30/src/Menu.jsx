import { useState, useMemo, useCallback, useContext } from "react";
import { useFetch } from "./useFetch.js";
import { CartContext } from "./CartContext.jsx";
import CategoryBar from "./CategoryBar.jsx";
import DishList from "./DishList.jsx";

function byPrice(a, b) {
  return a.price - b.price;
}

function Menu() {
  const [category, setCategory] = useState("All");
  const { data, loading, error } = useFetch("/dishes.json");
  const { dispatch } = useContext(CartContext);

  // Sorting is a real calculation over the fetched list, and DishList
  // is wrapped in React.memo — memoising here keeps its reference
  // stable when nothing relevant changed.
  const shown = useMemo(() => {
    const list = data ?? [];
    const filtered =
      category === "All" ? list : list.filter((d) => d.category === category);
    return [...filtered].sort(byPrice);
  }, [data, category]);

  // Stable reference so DishList (React.memo) doesn't re-render every
  // time Menu renders for an unrelated reason.
  const addToCart = useCallback(
    (dish) => dispatch({ type: "add", dish }),
    [dispatch]
  );

  if (loading) return <p>Loading the menu…</p>;
  if (error) return <p className="err">{error}</p>;

  return (
    <div>
      <CategoryBar selected={category} onSelect={setCategory} />
      <DishList dishes={shown} onAdd={addToCart} />
    </div>
  );
}

export default Menu;
