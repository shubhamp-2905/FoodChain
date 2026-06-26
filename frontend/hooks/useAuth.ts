// ============================================
// FoodChain AI - Auth Hook
// ============================================

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import type {
  UserProfile,
  LoginRequest,
  RegisterRequest,
} from "@/types/auth";

export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  // Check auth state on mount
  useEffect(() => {
    const storedUser = authService.getUser();
    const token = authService.getToken();

    if (token && storedUser) {
      setUser(storedUser);
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(
    async (data: LoginRequest) => {
      const response = await authService.login(data);
      authService.setToken(response.access_token);
      authService.setUser(response.user);
      setUser(response.user);
      setIsAuthenticated(true);
      router.push("/dashboard");
      return response;
    },
    [router]
  );

  const register = useCallback(
    async (data: RegisterRequest) => {
      const response = await authService.register(data);
      authService.setToken(response.access_token);
      authService.setUser(response.user);
      setUser(response.user);
      setIsAuthenticated(true);
      router.push("/dashboard");
      return response;
    },
    [router]
  );

  const logout = useCallback(() => {
    authService.removeToken();
    setUser(null);
    setIsAuthenticated(false);
    router.push("/login");
  }, [router]);

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await authService.getProfile();
      authService.setUser(profile);
      setUser(profile);
      return profile;
    } catch {
      logout();
      return null;
    }
  }, [logout]);

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshProfile,
  };
}
