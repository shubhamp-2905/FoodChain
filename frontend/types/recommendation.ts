// ============================================
// FoodChain AI - Recommendation Type Definitions
// ============================================

export interface SupplierRecommendation {
  id: number;
  supplier_id: string;
  supplier_name: string;
  supplier_type: string;
  market: string;
  area: string;
  latitude: number;
  longitude: number;
  ingredient: string;
  category: string;
  price: number;
  unit: string;
  stock_available: number;
  minimum_order: number;
  quality_score: number;
  rating: number;
  reliability_score: number;
  delivery_radius_km: number;
  distance_km: number;
  cluster: number;
  recommendation_score: number; // Internal debugging score
  
  // Phase 2 public fields
  delivery_time: number; // Maps to average_delivery_time_min
  match_score: number;   // 0 - 100
  confidence: "High" | "Medium" | "Low";
  reason: string;
}

export interface RecommendationMetadata {
  suppliers_checked: number;
  eligible_suppliers: number;
  processing_time_ms: number;
  model_version: string;
}

export interface RecommendationResponse {
  ingredient: string;
  generated_at: string;
  best_supplier: SupplierRecommendation | null;
  alternatives: SupplierRecommendation[];
  metadata: RecommendationMetadata;
}
