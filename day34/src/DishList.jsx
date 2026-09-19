import { memo, useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import Modal from "./Modal.jsx";

const DishList = memo(function DishList({ dishes }) {
  const [preview, setPreview] = useState(null);

  if (dishes.length === 0) return <p>No dishes in this category yet.</p>;

  return (
    <div className="dish-list">
      {dishes.map((d) => (
        <div key={d.id} className="dish-card">
          <Link to={`/menu/${d.id}`}>
            <h3>{d.name}</h3>
            <p>{d.price} ETB</p>
          </Link>
          <button onClick={() => setPreview(d)}>Quick view</button>
        </div>
      ))}

      {preview && (
        <Modal title={preview.name} onClose={() => setPreview(null)}>
          <h3>{preview.name}</h3>
          <p>{preview.price} ETB</p>
          <p>Category: {preview.category}</p>
        </Modal>
      )}
    </div>
  );
});

DishList.propTypes = {
  dishes: PropTypes.array.isRequired,
};

export default DishList;
