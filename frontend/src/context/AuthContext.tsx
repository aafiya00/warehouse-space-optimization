import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import axios from "axios";

interface User {
  id: number;
  username: string;
  role: string;
  email: string;
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
    // Step 1: get JWT tokens
    const res = await axios.post(
      "https://warehouse-space-optimization.onrender.com/api/auth/login/",
      { username, password }
    );
    const { access, refresh } = res.data;
    localStorage.setItem("access", access);
    localStorage.setItem("refresh", refresh);

    // Step 2: fetch real user profile to get actual role
    const profileRes = await axios.get("https://warehouse-space-optimization.onrender.com/api/auth/me/", {
      headers: { Authorization: `Bearer ${access}` },
    });
    const userData: User = {
      id: profileRes.data.id,
      username: profileRes.data.username,
      role: profileRes.data.role,
      email: profileRes.data.email,
    };
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
