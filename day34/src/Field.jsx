import PropTypes from "prop-types";

function Field({ id, label, error, children }) {
  const showError = !!error;

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      {showError && (
        <p id={`${id}-error`} role="alert" className="err">
          {error}
        </p>
      )}
    </div>
  );
}

Field.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  error: PropTypes.string,
  children: PropTypes.node.isRequired,
};

export default Field;
