"use client";
import { AuthAPI } from "@/lib/api";
import { User } from "@/types/auth";
import React, { createContext, useState, useContext, useEffect } from "react";

interface AuthContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  loading: boolean;
  rememberMe: boolean;
  setRememberMe: React.Dispatch<React.SetStateAction<boolean>>;
  login: (
    email: string,
    password: string
  ) => Promise<{ ok: boolean; message: string } | void>;
  logout: () => void;
  register: (
    name: string,
    email: string,
    password: string
  ) => Promise<{ ok: boolean; message: string } | void>;
  refreshMe: () => Promise<void>;
}

const Ctx = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [rememberMe, setRememberMe] = useState(false);

  // fetch user on mount
  useEffect(() => {
    (async () => {
      console.log("Entered User Refresh in auth context: ");
      const refresh = localStorage.getItem("refreshExists");
      console.log("Does refresh exist?: ", refresh);
      if (refresh) {
        try {
          const response = await AuthAPI.me();
          setUser(response.user);
        } catch (error) {
          console.error("Failed to fetch user on mount", error);
          setUser(null);
        }
      }
      setLoading(false);
    })();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      //console.log("🔐 Starting login attempt...");
      console.log("📱 User agent:", navigator.userAgent);
      //console.log("🌐 API URL:", process.env.NEXT_PUBLIC_API_URL);

      const response = await AuthAPI.login({ email, password });
      //console.log("✅ Login response received:", response);

      setUser(response.user);
      localStorage.setItem("accessToken", response.accessToken);
      localStorage.setItem("refreshExists", "true");
      setLoading(false);

      console.log("✅ Login successful, user set");
      return { ok: true, message: response.message };
    } catch (error) {
      // Enhanced error logging for mobile debugging
      console.error("❌ Login failed - Full error:", error);
      console.error(
        "❌ Error message:",
        error instanceof Error ? error.message : "Unknown error"
      );
      console.error(
        "❌ Error stack:",
        error instanceof Error ? error.stack : "No stack trace"
      );

      // Log network-specific errors
      if (error instanceof TypeError && error.message.includes("fetch")) {
        console.error("🌐 Network error - Check internet connection and CORS");
      }

      // Return more specific error message
      const errorMessage =
        error instanceof Error ? error.message : "Login failed";
      return { ok: false, message: `Login failed: ${errorMessage}` };
    }
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshExists");
    await AuthAPI.logout();
  };

  const refreshMe = async () => {
    try {
      const response = await AuthAPI.me();
      setUser(response.user);
    } catch (error) {
      console.error("Failed to refresh user data", error);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await AuthAPI.register({ name, email, password });
      setUser(response.user);
      localStorage.setItem("accessToken", response.accessToken);
      localStorage.setItem("refreshExists", "true");
      return { ok: true, message: response.message };
    } catch (error) {
      console.error("Registration failed", error);
      return { ok: false, message: "Registration failed" };
    }
  };

  return (
    <Ctx.Provider
      value={{
        user,
        setUser,
        login,
        logout,
        refreshMe,
        loading,
        register,
        rememberMe,
        setRememberMe,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
};
