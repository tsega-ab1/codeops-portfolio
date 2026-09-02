import { useState, useEffect, useRef } from "react";
import CategoryBar from "./CategoryBar.jsx";
import DishList from "./DishList.jsx";
import { fetchDishes } from "./api.js";

function Menu() {
  const [category, setCategory] = useState("All");
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const searchRef = useRef(null);

  useEffect(() => {
    searchRef.current.focus();
  }, []);

  useEffect(() => {
    document.title = `Addis Eats — ${dishes.length} items`;
  }, [dishes]);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);

    fetchDishes(category, ctrl.signal)
      .then(setDishes)
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      })
      .finally(() => setLoading(false));

    return () => ctrl.abort();
  }, [category]);

  return (
    <div>
      <input ref={searchRef} placeholder="Search the menu…" />
      <CategoryBar selected={category} onSelect={setCategory} />

      {loading && <p>Loading the menu…</p>}
      {!loading && error && <p className="err">{error}</p>}
      {!loading && !error && <DishList dishes={dishes} />}
    </div>
  );
}

export default Menu;
