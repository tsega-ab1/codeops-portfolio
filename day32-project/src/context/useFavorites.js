import { useContext } from "react";
import { FavoritesContext } from "./FavoritesContext.jsx";

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (ctx === null) {
    throw new Error("useFavorites must be used inside a FavoritesProvider");
  }
  return ctx;
}
