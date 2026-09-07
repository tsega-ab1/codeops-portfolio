import PropTypes from "prop-types";

const cats = ["All", "Main", "Vegan", "Grill"];

function CategoryBar({ selected, onSelect }) {
  return (
    <div className="category-bar">
      {cats.map((cat) => (
        <button
          key={cat}
          className={cat === selected ? "chip on" : "chip"}
          onClick={() => onSelect(cat)}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}

CategoryBar.propTypes = {
  selected: PropTypes.string.isRequired,
  onSelect: PropTypes.func.isRequired,
};

export default CategoryBar;
