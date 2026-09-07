import { memo } from "react";
import PropTypes from "prop-types";

const DishList = memo(function DishList({ dishes, onAdd }) {
  if (dishes.length === 0) {
    return <p>No dishes in this category yet.</p>;
  }

  return (
    <div className="dish-list">
      {dishes.map((d) => (
        <div key={d.id} className="dish">
          <h3>{d.name}</h3>
          <p>{d.price} ETB</p>
          <button onClick={() => onAdd(d)}>Add</button>
        </div>
      ))}
    </div>
  );
});

DishList.propTypes = {
  dishes: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      price: PropTypes.number.isRequired,
    })
  ).isRequired,
  onAdd: PropTypes.func.isRequired,
};

export default DishList;
