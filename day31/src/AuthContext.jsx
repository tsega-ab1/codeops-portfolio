import { createContext, useState, useMemo } from "react";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  function login(phone) {
    setLoading(true);
    return new Promise((resolve) => {
      setTimeout(() => {
        setUser({ phone });
        setLoading(false);
        resolve();
      }, 300);
    });
  }

  function logout() {
    setUser(null);
  }

  const value = useMemo(
    () => ({ user, loading, login, logout }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
