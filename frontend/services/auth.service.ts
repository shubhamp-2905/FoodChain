// ============================================
// FoodChain AI - Auth Service
// ============================================

import api from "@/lib/axios";
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  UserProfile,
  UpdateProfileRequest,
} from "@/types/auth";

export const authService = {
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/auth/register", data);
    return response.data;
  },

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/auth/login", data);
    return response.data;
  },

  async getProfile(): Promise<UserProfile> {
    const response = await api.get<UserProfile>("/profile");
    return response.data;
  },

  async updateProfile(data: UpdateProfileRequest): Promise<UserProfile> {
    const response = await api.put<UserProfile>("/profile", data);
    return response.data;
  },

  async changePassword(data: any): Promise<UserProfile> {
    const response = await api.put<UserProfile>("/profile/password", data);
    return response.data;
  },


  // Token management
  setToken(token: string): void {
    localStorage.setItem("access_token", token);
  },

  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("access_token");
  },

  removeToken(): void {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
  },

  setUser(user: UserProfile): void {
    localStorage.setItem("user", JSON.stringify(user));
  },

  getUser(): UserProfile | null {
    if (typeof window === "undefined") return null;
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  logout(): void {
    this.removeToken();
    window.location.href = "/login";
  },
};
