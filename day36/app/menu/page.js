import DishList from "./DishList.jsx";
import CategoryBar from "./CategoryBar.jsx";
import { dishes } from "./dishes.js";

export default function MenuPage() {
  return (
    <div>
      <h2 className="text-xl font-semibold">Menu</h2>
      <CategoryBar />
      <DishList dishes={dishes} />
    </div>
  );
}
