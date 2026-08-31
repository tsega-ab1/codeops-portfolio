import PropTypes from "prop-types";
import Dish from "./Dish.jsx";

function DishList({ dishes, onAdd }) {
  if (dishes.length === 0) {
    return <p>No dishes in this category yet.</p>;
  }

  return (
    <div className="dish-list">
      {dishes.map((d) => (
        <Dish key={d.id} name={d.name} price={d.price} onAdd={onAdd} />
      ))}
    </div>
  );
}

DishList.propTypes = {
  dishes: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      price: PropTypes.number.isRequired,
      category: PropTypes.string.isRequired,
    })
  ).isRequired,
  onAdd: PropTypes.func.isRequired,
};

export default DishList;
