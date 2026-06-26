from pydantic import BaseModel
from typing import List, Optional

class SupplierRecommendation(BaseModel):
    """Schema representing a rich recommended supplier and its offering details."""
    id: int
    supplier_id: str
    supplier_name: str
    supplier_type: str
    market: str
    area: str
    latitude: float
    longitude: float
    ingredient: str
    category: str
    price: float
    unit: str
    stock_available: int
    minimum_order: int
    quality_score: float
    rating: float
    reliability_score: float
    delivery_radius_km: float
    distance_km: float
    cluster: int
    recommendation_score: float  # Internal debug score
    
    # Rich Phase 2 public attributes
    delivery_time: int  # Maps to average_delivery_time_min
    match_score: int    # 0 - 100
    confidence: str     # "High", "Medium", "Low"
    reason: str         # Generated natural language description

class RecommendationMetadata(BaseModel):
    """Schema representing diagnostics metadata for recommendations."""
    suppliers_checked: int
    eligible_suppliers: int
    processing_time_ms: int
    model_version: str = "1.0.0"

class RecommendationResponse(BaseModel):
    """Schema representing the overall rich recommendation response."""
    ingredient: str
    generated_at: str
    best_supplier: Optional[SupplierRecommendation] = None
    alternatives: List[SupplierRecommendation] = []
    metadata: RecommendationMetadata
