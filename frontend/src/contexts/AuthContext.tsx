import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "@/types";
import { mockUsers } from "@/lib/mockData";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: "borrower" | "lender") => Promise<void>;
  logout: () => void;
  updateRole: (role: "borrower" | "lender") => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check for stored session
    const storedUser = localStorage.getItem("lelodedo_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (email: string, password: string) => {
    // Mock login - in real app, this would call an API
    const foundUser = mockUsers.find(u => u.email === email);
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem("lelodedo_user", JSON.stringify(foundUser));
    } else {
      throw new Error("Invalid credentials");
    }
  };

  const register = async (name: string, email: string, password: string, role: "borrower" | "lender") => {
    // Mock registration
    const newUser: User = {
      id: Date.now().toString(),
      name,
      email,
      role,
      rating: 0,
      totalRentals: 0,
      joinedDate: new Date().toISOString(),
    };
    setUser(newUser);
    localStorage.setItem("lelodedo_user", JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("lelodedo_user");
  };

  const updateRole = (role: "borrower" | "lender") => {
    if (user) {
      const updatedUser = { ...user, role };
      setUser(updatedUser);
      localStorage.setItem("lelodedo_user", JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateRole, isAuthenticated: !!user }}>
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
