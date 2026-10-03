"use client";

import { useCart } from "@/context/CartContext";
import { dishes } from "@/lib/dishes-data";

export default function CartClient() {
  const { items, updateQuantity, removeItem } = useCart();

  const cartDishes = items
    .map((item) => {
      const dish = dishes.find((d) => d.id === item.id);
      return dish ? { ...dish, quantity: item.quantity } : null;
    })
    .filter(Boolean);

  const total = cartDishes.reduce((sum, d) => sum + d.price * d.quantity, 0);

  if (cartDishes.length === 0) {
    return (
      <div className="checkout-card">
        <p>Your cart is empty.</p>
        <a href="/menu" className="primary-button">
          Browse the Menu
        </a>
      </div>
    );
  }

  return (
    <div className="checkout-card">
      {cartDishes.map((item) => (
        <div className="checkout-row" key={item.id}>
          <div>
            <strong>{item.name}</strong>
            <p>
              <button onClick={() => updateQuantity(item.id, -1)}>-</button>{" "}
              {item.quantity}{" "}
              <button onClick={() => updateQuantity(item.id, 1)}>+</button>{" "}
              × {item.price} ETB
            </p>
          </div>
          <div>
            <strong>{item.price * item.quantity} ETB</strong>
            <br />
            <button onClick={() => removeItem(item.id)}>Remove</button>
          </div>
        </div>
      ))}
      <div className="checkout-total">Total: {total} ETB</div>
      <a href="/checkout" className="primary-button">
        Continue to Checkout
      </a>
    </div>
  );
}
