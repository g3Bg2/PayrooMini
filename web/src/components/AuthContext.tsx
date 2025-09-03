import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import client from "../api/client";
import { jwtDecode } from "jwt-decode";

interface AuthContextType {
  isAuthenticated: boolean;
  userEmail: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("jwt_token");
    if (token) {
      setIsAuthenticated(true);
      try {
        const decoded: any = jwtDecode(token);
        setUserEmail(decoded.email || null);
      } catch {
        setUserEmail(null);
      }
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email) || password.trim().length === 0) {
      return false;
    }

    try {
      const res = await client.post("/login", { email, password });
      const data = res.data;
      if (data.token) {
        localStorage.setItem("jwt_token", data.token);
        setUserEmail(email);
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setUserEmail(null);
    setIsAuthenticated(false);
    localStorage.removeItem("jwt_token");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userEmail, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
