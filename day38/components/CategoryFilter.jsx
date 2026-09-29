"use client";

import { useState } from "react";
import AddToCartButton from "./AddToCartButton.jsx";

const categories = ["All", "ethiopian", "pizza", "burger"];

export default function CategoryFilter({ dishes, initialCategory = "All" }) {
  const [category, setCategory] = useState(initialCategory);

  const shown =
    category === "All" ? dishes : dishes.filter((d) => d.category === category);

  return (
    <div>
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        {categories.map((c) => (
          <button key={c} onClick={() => setCategory(c)} className="primary-button">
            {c}
          </button>
        ))}
      </div>
      <div className="dish-grid">
        {shown.map((dish) => (
          <div className="dish-card" key={dish.id}>
            <div className="dish-image">{dish.emoji}</div>
            <div className="dish-content">
              <h2>{dish.name}</h2>
              <p className="dish-description">{dish.description}</p>
              <p className="dish-price">{dish.price} ETB</p>
              <AddToCartButton dish={dish} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
