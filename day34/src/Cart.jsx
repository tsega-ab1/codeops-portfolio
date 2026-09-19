import { Link } from "react-router-dom";
import { useCartStore } from "./cartStore.js";

function Cart() {
  const items = useCartStore((s) => s.items);
  const remove = useCartStore((s) => s.remove);

  // derived during render, not stored
  const total = items.reduce((sum, d) => sum + d.price, 0);

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
            <button onClick={() => remove(d.id)}>×</button>
          </li>
        ))}
      </ul>
      <p>Total: {total} ETB</p>
      <Link to="/checkout">Go to checkout</Link>
    </div>
  );
}

export default Cart;
