import { createContext, useState, useMemo } from "react";

export const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const [favoriteClubs, setFavoriteClubs] = useState([]);

  function toggleFavorite(clubId) {
    setFavoriteClubs((prev) =>
      prev.includes(clubId)
        ? prev.filter((id) => id !== clubId)
        : [...prev, clubId]
    );
  }

  const value = useMemo(
    () => ({ favoriteClubs, toggleFavorite }),
    [favoriteClubs]
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}
