import { useState } from "react";
import PropTypes from "prop-types";

function Dish({ name, price, onAdd }) {
  const [count, setCount] = useState(0);

  function handleAdd() {
    setCount(count + 1);
    onAdd(price);
  }

  return (
    <div className="dish">
      <h3>{name}</h3>
      <p>{price} ETB</p>
      <button onClick={handleAdd}>Add</button>
      <span> {count}</span>
    </div>
  );
}

Dish.propTypes = {
  name: PropTypes.string.isRequired,
  price: PropTypes.number.isRequired,
  onAdd: PropTypes.func.isRequired,
};

export default Dish;
