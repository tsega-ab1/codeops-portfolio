import { useState } from "react";
import { dishes } from "./data.js";
import CategoryBar from "./CategoryBar.jsx";
import DishList from "./DishList.jsx";
import OrderForm from "./OrderForm.jsx";

function Menu() {
  const [category, setCategory] = useState("All");
  const [total, setTotal] = useState(0);

  const shown =
    category === "All"
      ? dishes
      : dishes.filter((d) => d.category === category);

  function addToOrder(price) {
    setTotal(total + price);
  }

  return (
    <div>
      <CategoryBar selected={category} onSelect={setCategory} />
      <DishList dishes={shown} onAdd={addToOrder} />
      <h2>Total: {total} ETB</h2>
      <OrderForm />
    </div>
  );
}

export default Menu;
