"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { apiClient, type PublicUser } from "./api-client";

interface AuthContextType {
  user: PublicUser | null;
  accessToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      apiClient.setAccessToken(token);
      setAccessToken(token);
      apiClient
        .getMe()
        .then((user) => setUser(user))
        .catch(() => {
          localStorage.removeItem("accessToken");
          setAccessToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await apiClient.login(email, password);
    apiClient.setAccessToken(response.accessToken);
    localStorage.setItem("accessToken", response.accessToken);
    localStorage.setItem("refreshToken", response.refreshToken);
    setAccessToken(response.accessToken);
    setUser(response.user);
  };

  const register = async (email: string, password: string, displayName: string) => {
    const response = await apiClient.register(email, password, displayName);
    apiClient.setAccessToken(response.accessToken);
    localStorage.setItem("accessToken", response.accessToken);
    localStorage.setItem("refreshToken", response.refreshToken);
    setAccessToken(response.accessToken);
    setUser(response.user);
  };

  const logout = async () => {
    if (accessToken) {
      try {
        await apiClient.logout(accessToken);
      } catch (e) {
        console.error("Logout error:", e);
      }
    }
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    apiClient.setAccessToken(null);
    setAccessToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
