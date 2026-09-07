import { useContext } from "react";
import { CartContext } from "./CartContext.jsx";

function CheckoutPanel() {
  const { items, dispatch, total } = useContext(CartContext);

  return (
    <div className="checkout-panel">
      <h2>Checkout</h2>
      {items.length === 0 && <p>Your cart is empty.</p>}
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
      <button onClick={() => dispatch({ type: "clear" })}>Clear cart</button>
    </div>
  );
}

export default CheckoutPanel;
