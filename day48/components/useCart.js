"use client";

import { useEffect, useState } from "react";
import { readCart } from "@/lib/cart-store";

export function useCart() {
  const [cart, setCart] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => setCart(readCart());
    sync();
    setReady(true);
    window.addEventListener("cart-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("cart-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return { cart, ready };
}
