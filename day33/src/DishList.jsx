import PropTypes from "prop-types";
import { Link } from "react-router-dom";

function DishList({ dishes }) {
  if (dishes.length === 0) return <p>No dishes in this category yet.</p>;

  return (
    <div className="dish-list">
      {dishes.map((d) => (
        <Link key={d.id} to={`/menu/${d.id}`} className="dish-card">
          <h3>{d.name}</h3>
          <p>{d.price} ETB</p>
        </Link>
      ))}
    </div>
  );
}

DishList.propTypes = {
  dishes: PropTypes.array.isRequired,
};

export default DishList;
