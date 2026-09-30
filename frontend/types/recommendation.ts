// ============================================
// FoodChain AI - Recommendation Type Definitions
// Phase 10 Aligned: Auditability & Deterministic Explainability
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
  quality_score: number | null;
  rating: number | null;
  reliability_score: number | null;
  delivery_radius_km: number;
  distance_km: number;
  cluster: number;
  cluster_label?: string;
  cluster_desc?: string;
  recommendation_score: number; // Internal continuous score
  
  // Public decision attributes
  rank?: number;
  delivery_time: number; // Maps to average_delivery_time_min
  match_score: number;   // 0 - 100 normalized score
  confidence: "High" | "Medium" | "Low";
  reason: string;        // Grounded natural language explanation
  explanation?: string;  // Deterministic explanation alias
  explanation_factors?: Record<string, any>;
}


export interface RecommendationMetadata {
  suppliers_checked: number;
  eligible_suppliers: number;
  processing_time_ms: number;
  model_version: string;
  request_id?: string;
  api_version?: string;
}

export interface RecommendationResponse {
  ingredient: string;
  generated_at: string;
  best_supplier: SupplierRecommendation | null;
  alternatives: SupplierRecommendation[];
  metadata: RecommendationMetadata;
}

export interface RecommendationAudit {
  id: number;
  request_id: string;
  user_id: number | null;
  ingredient: string;
  vendor_latitude: number;
  vendor_longitude: number;
  suppliers_checked: number;
  eligible_suppliers: number;
  selected_supplier_id: string | null;
  selected_supplier_name: string | null;
  recommendation_score: number | null;
  match_score: number | null;
  processing_time_ms: number;
  model_version: string;
  api_version: string;
  created_at: string;
}

export interface RecommendationAuditListResponse {
  audits: RecommendationAudit[];
  total: number;
  limit: number;
  offset: number;
}
