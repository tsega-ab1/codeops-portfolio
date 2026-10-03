"use client";

import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  // Load from localStorage once on mount
  useEffect(() => {
    const saved = localStorage.getItem("addis-eats-cart");
    if (saved) setItems(JSON.parse(saved));
  }, []);

  // Persist on every change
  useEffect(() => {
    localStorage.setItem("addis-eats-cart", JSON.stringify(items));
  }, [items]);

  function addItem(dishId) {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === dishId);
      if (existing) {
        return prev.map((i) =>
          i.id === dishId ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { id: dishId, quantity: 1 }];
    });
  }

  function updateQuantity(dishId, delta) {
    setItems((prev) =>
      prev
        .map((i) => (i.id === dishId ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0)
    );
  }

  function removeItem(dishId) {
    setItems((prev) => prev.filter((i) => i.id !== dishId));
  }

  return (
    <CartContext.Provider value={{ items, addItem, updateQuantity, removeItem }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (ctx === null) {
    throw new Error("useCart must be used inside a CartProvider");
  }
  return ctx;
}
