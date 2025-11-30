import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "@/types";
import api from "@/lib/api";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: "borrower" | "lender", phone_number?: string) => Promise<void>;
  logout: () => void;
  updateRole: (role: "borrower" | "lender") => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored session and token on app load
    const initAuth = async () => {
      try {
        const token = localStorage.getItem("lelodedo_token");
        
        if (token) {
          // Verify token is still valid
          const response = await api.auth.getCurrentUser();
          setUser(response.data);
        }
      } catch (error) {
        // Token expired or invalid
        localStorage.removeItem("lelodedo_token");
        localStorage.removeItem("lelodedo_user");
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('🔐 AuthContext LOGIN: Calling api.auth.login');
      const response = await api.auth.login(email, password);
      console.log('✅ AuthContext LOGIN RESPONSE:', response);
      
      // Transform interceptor converts access_token to accessToken (snake_case to camelCase)
      const { accessToken } = response.data;
      console.log('🔑 Got token:', accessToken ? 'YES' : 'NO');
      
      localStorage.setItem("lelodedo_token", accessToken);
      
      // Get current user data
      console.log('👤 Fetching current user...');
      const userResponse = await api.auth.getCurrentUser();
      console.log('✅ Got user data:', userResponse.data);
      
      const userData = userResponse.data;
      
      setUser(userData);
      localStorage.setItem("lelodedo_user", JSON.stringify(userData));
      console.log('✅ LOGIN COMPLETE');
    } catch (error: any) {
      console.error('❌ AuthContext LOGIN ERROR:', error);
      console.error('Error response:', error.response?.data);
      throw new Error(error.message || "Login failed");
    }
  };

  const register = async (name: string, email: string, password: string, role: "borrower" | "lender", phone_number?: string) => {
    try {
      await api.auth.register({ name, email, password, role: role.toUpperCase(), phone_number });
      // After registration, login automatically
      await login(email, password);
    } catch (error: any) {
      throw new Error(error.message || "Registration failed");
    }
  };

  const logout = () => {
    api.auth.logout();
    setUser(null);
  };

  const updateRole = (role: "borrower" | "lender") => {
    if (user) {
      const updatedUser = { ...user, role };
      setUser(updatedUser);
      localStorage.setItem("lelodedo_user", JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateRole, isAuthenticated: !!user, isLoading }}>
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
