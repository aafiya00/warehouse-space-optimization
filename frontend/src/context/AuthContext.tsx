import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import axios from "axios";

interface User {
  username: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("access");
    const saved = localStorage.getItem("user");
    if (token && saved) {
      try {
        setUser(JSON.parse(saved));
      } catch {
        localStorage.clear();
      }
    }
  }, []);

  const login = async (username: string, password: string) => {
    const res = await axios.post(
      "http://localhost:8000/api/auth/login/",
      { username, password }
    );
    const { access, refresh } = res.data;
    localStorage.setItem("access", access);
    localStorage.setItem("refresh", refresh);
    const userData: User = { username, role: "staff" };
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}