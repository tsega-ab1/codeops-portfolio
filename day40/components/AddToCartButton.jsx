"use client";

import { useCart } from "@/context/CartContext";

export default function AddToCartButton({ dishId }) {
  const { addItem } = useCart();

  return (
    <button className="primary-button" onClick={() => addItem(dishId)}>
      Add to Cart
    </button>
  );
}
