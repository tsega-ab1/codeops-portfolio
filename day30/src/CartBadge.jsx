import { useContext } from "react";
import { CartContext } from "./CartContext.jsx";

function CartBadge() {
  const { items, total } = useContext(CartContext);

  return (
    <div className="cart-badge">
      🛒 {items.length} items — {total} ETB
    </div>
  );
}

export default CartBadge;
