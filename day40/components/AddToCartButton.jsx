"use client";

import { useState } from "react";

export default function AddToCartButton({ dish }) {
  const [count, setCount] = useState(0);

  return (
    <button className="primary-button" onClick={() => setCount(count + 1)}>
      Add to Cart ({count})
    </button>
  );
}
