import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/auth/me").then((d) => setUser(d.user)).catch(() => setUser(null)).finally(() => setLoading(false));
  }, []);

  const refresh = useCallback(async () => {
    const d = await api.get("/auth/me");
    setUser(d.user);
    return d.user;
  }, []);

  const login = useCallback(async (email, password) => {
    const d = await api.post("/auth/login", { email, password });
    setUser(d.user);
    return d.user;
  }, []);

  const signup = useCallback(async (payload) => {
    const d = await api.post("/auth/signup", payload);
    setUser(d.user);
    return d.user;
  }, []);

  const logout = useCallback(async () => {
    await api.post("/auth/logout");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refresh, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
