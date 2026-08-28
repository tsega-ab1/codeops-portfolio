import PropTypes from "prop-types";
import Dish from "./Dish.jsx";

function Menu({ dishes, category }) {
  const shown = dishes.filter((d) => d.category === category);

  if (shown.length === 0) {
    return <p>No {category} dishes.</p>;
  }

  return (
    <div className="menu">
      {shown.map((d) => (
        <Dish key={d.id} {...d} />
      ))}
    </div>
  );
}

Menu.propTypes = {
  dishes: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      price: PropTypes.number.isRequired,
      category: PropTypes.string.isRequired,
      spicy: PropTypes.bool,
    })
  ).isRequired,
  category: PropTypes.string.isRequired,
};

export default Menu;
