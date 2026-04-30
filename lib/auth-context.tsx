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

function persistTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("refreshToken", refreshToken);
}

function clearTokens() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wire up token refresh callbacks once on mount.
    // setUser/setAccessToken are stable React dispatch functions.
    apiClient.setOnTokensRefreshed(({ accessToken: at, refreshToken: rt }) => {
      persistTokens(at, rt);
      setAccessToken(at);
    });

    apiClient.setOnAuthExpired(() => {
      clearTokens();
      setUser(null);
      setAccessToken(null);
    });
  }, []);

  useEffect(() => {
    const storedAccess = localStorage.getItem("accessToken");
    const storedRefresh = localStorage.getItem("refreshToken");

    if (!storedAccess) {
      setLoading(false);
      return;
    }

    apiClient.setTokens(storedAccess, storedRefresh);
    setAccessToken(storedAccess);

    apiClient
      .getMe()
      .then((u) => setUser(u))
      .catch(() => {
        clearTokens();
        apiClient.setTokens(null, null);
        setAccessToken(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const response = await apiClient.login(email, password);
    apiClient.setTokens(response.accessToken, response.refreshToken);
    persistTokens(response.accessToken, response.refreshToken);
    setAccessToken(response.accessToken);
    setUser(response.user);
  };

  const register = async (email: string, password: string, displayName: string) => {
    const response = await apiClient.register(email, password, displayName);
    apiClient.setTokens(response.accessToken, response.refreshToken);
    persistTokens(response.accessToken, response.refreshToken);
    setAccessToken(response.accessToken);
    setUser(response.user);
  };

  const logout = async () => {
    try {
      await apiClient.logout();
    } catch {
      // ignore — clear session regardless
    }
    clearTokens();
    apiClient.setTokens(null, null);
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
