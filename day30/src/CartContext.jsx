import { createContext, useReducer, useMemo } from "react";
import { cartReducer } from "./cartReducer.js";

export const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  const total = state.items.reduce((sum, d) => sum + d.price, 0);

  // Memoised so consumers only re-render when items or total actually
  // change, not on every CartProvider render (a fresh object literal
  // as `value` would otherwise be a new reference every time).
  const value = useMemo(
    () => ({ items: state.items, dispatch, total }),
    [state.items, total]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
