// ============================================
// FoodChain AI - Auth Types
// ============================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  full_name: string;
  email: string;
  password: string;
  mobile_number: string;
  business_name: string;
  food_type: string;
  latitude?: number | null;
  longitude?: number | null;
  area?: string | null;
  city?: string | null;
  state?: string | null;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: UserProfile;
}

export interface UserProfile {
  id: number;
  full_name: string;
  email: string;
  mobile_number: string;
  business_name: string;
  food_type: string;
  latitude: number | null;
  longitude: number | null;
  area: string | null;
  city: string | null;
  state: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpdateProfileRequest {
  full_name?: string;
  mobile_number?: string;
  business_name?: string;
  food_type?: string;
  latitude?: number | null;
  longitude?: number | null;
  area?: string | null;
  city?: string | null;
  state?: string | null;
}

export const FOOD_TYPES = [
  "Vada Pav",
  "Pani Puri",
  "Misal Pav",
  "Dosa",
  "Sandwich",
  "Tea Stall",
  "Bhaji",
  "Chaat",
  "Biryani",
  "Other",
] as const;

export type FoodType = (typeof FOOD_TYPES)[number];
