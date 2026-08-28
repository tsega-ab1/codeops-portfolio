import PropTypes from "prop-types";

// A reusable wrapper that renders whatever is nested inside it.
// Used to give any content (a dish, a form, a message) the same card shell.
function Card({ children }) {
  return <div className="card">{children}</div>;
}

Card.propTypes = {
  children: PropTypes.node.isRequired,
};

export default Card;
