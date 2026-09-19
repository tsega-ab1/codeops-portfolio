import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useFetch } from "./useFetch.js";
import CategoryBar from "./CategoryBar.jsx";
import DishList from "./DishList.jsx";

function Menu() {
  const [params, setParams] = useSearchParams();
  const category = params.get("category") ?? "All";
  const { data, loading, error } = useFetch("/dishes.json");

  const shown = useMemo(() => {
    const list = data ?? [];
    return category === "All" ? list : list.filter((d) => d.category === category);
  }, [data, category]);

  function selectCategory(cat) {
    setParams(cat === "All" ? {} : { category: cat });
  }

  if (loading) return <p>Loading the menu…</p>;
  if (error) return <p className="err">{error}</p>;

  return (
    <div>
      <CategoryBar selected={category} onSelect={selectCategory} />
      <DishList dishes={shown} />
    </div>
  );
}

export default Menu;
