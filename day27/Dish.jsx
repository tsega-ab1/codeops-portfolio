import PropTypes from "prop-types";
import Card from "./Card.jsx";

// name and price are required; currency defaults to ETB; spicy is optional.
function Dish({ name, price, currency = "ETB", spicy }) {
  return (
    <Card>
      <h3>
        {name} {spicy && <span className="badge">🌶 Spicy</span>}
      </h3>
      <p>
        {price} {currency}
      </p>
    </Card>
  );
}

Dish.propTypes = {
  name: PropTypes.string.isRequired,
  price: PropTypes.number.isRequired,
  currency: PropTypes.string,
  spicy: PropTypes.bool,
};

export default Dish;
