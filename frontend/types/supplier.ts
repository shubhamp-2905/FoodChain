// ============================================
// FoodChain AI - Supplier Types
// ============================================

export interface Supplier {
  id: number;
  supplier_id: string;
  supplier_name: string;
  supplier_type: string;
  market: string;
  area: string;
  latitude: number;
  longitude: number;
  quality_score: number;
  rating: number;
  reliability_score: number;
  delivery_radius_km: number;
  average_delivery_time_min: number;
  products?: Product[];
}

export interface Product {
  id: number;
  supplier_id: number;
  ingredient: string;
  category: string;
  price: number;
  unit: string;
  stock_available: number;
  minimum_order: number;
}

export interface SupplierSearchParams {
  search?: string;
  area?: string;
  supplier_type?: string;
  page?: number;
  limit?: number;
  latitude?: number;
  longitude?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export const SUPPLIER_TYPES = [
  "Vegetable Wholesaler",
  "Spice Supplier",
  "Grain Dealer",
  "Oil Distributor",
  "Dairy Supplier",
  "Grocery Wholesaler",
] as const;

export const AREAS = [
  "Kharadi",
  "Hinjewadi",
  "Pimple Saudagar",
  "Wakad",
  "Baner",
  "Aundh",
  "Kothrud",
  "Deccan",
  "Swargate",
  "Shivajinagar",
  "Camp",
  "Hadapsar",
  "Magarpatta",
  "Viman Nagar",
  "Koregaon Park",
  "Kalyani Nagar",
  "Pune Station",
  "Katraj",
  "Bibwewadi",
  "Kondhwa",
] as const;
