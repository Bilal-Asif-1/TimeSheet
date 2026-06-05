import { createContext, useContext, useState } from "react";

// Ye purana/simple auth context helper hai; current main JWT flow App.tsx manage karta hai.
const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: any) => {
  const [user, setUser] = useState(localStorage.getItem("user") || null);

  const login = (username: string) => {
    localStorage.setItem("user", username);
    setUser(username);
  };

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
