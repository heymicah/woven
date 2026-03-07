import React, { createContext, useState, useEffect, ReactNode } from "react";
import * as SecureStore from "expo-secure-store";
import { User, LoginPayload, RegisterPayload } from "../types";
import { authService } from "../services/auth.service";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    try {
      const token = await SecureStore.getItemAsync("auth_token");
      if (token) {
        const userData = await authService.getMe();
        setUser(userData);
      }
    } catch {
      await SecureStore.deleteItemAsync("auth_token");
    } finally {
      setIsLoading(false);
    }
  }

  async function login(payload: LoginPayload) {
    const { token, user: userData } = await authService.login(payload);
    await SecureStore.setItemAsync("auth_token", token);
    setUser(userData);
  }

  async function register(payload: RegisterPayload) {
    const { token, user: userData } = await authService.register(payload);
    await SecureStore.setItemAsync("auth_token", token);
    setUser(userData);
  }

  async function logout() {
    await SecureStore.deleteItemAsync("auth_token");
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
