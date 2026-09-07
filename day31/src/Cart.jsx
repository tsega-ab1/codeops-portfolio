import { useContext } from "react";
import { Link } from "react-router-dom";
import { CartContext } from "./CartContext.jsx";

function Cart() {
  const { items, dispatch, total } = useContext(CartContext);

  if (items.length === 0) {
    return (
      <div>
        <p>Your cart is empty.</p>
        <Link to="/menu">Browse the menu</Link>
      </div>
    );
  }

  return (
    <div>
      <h2>Your Order</h2>
      <ul>
        {items.map((d) => (
          <li key={d.id}>
            {d.name} — {d.price} ETB
            <button onClick={() => dispatch({ type: "remove", id: d.id })}>
              ×
            </button>
          </li>
        ))}
      </ul>
      <p>Total: {total} ETB</p>
      <Link to="/checkout">Go to checkout</Link>
    </div>
  );
}

export default Cart;
