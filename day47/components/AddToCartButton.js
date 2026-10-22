"use client";

import { useState } from "react";
import { addToCart } from "@/lib/cart-store";

export default function AddToCartButton({ dish }) {
  const [added, setAdded] = useState(false);

  return (
    <button
      onClick={() => {
        addToCart({ id: dish.id, name: dish.name, price: dish.price });
        setAdded(true);
      }}
    >
      {added ? "Added ✓ — add another" : "Add to cart"}
    </button>
  );
}
