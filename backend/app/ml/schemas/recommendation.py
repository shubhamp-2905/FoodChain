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
    quality_score: Optional[float] = None
    rating: Optional[float] = None
    reliability_score: Optional[float] = None
    delivery_radius_km: float
    distance_km: float
    cluster: int
    cluster_label: Optional[str] = None
    recommendation_score: float  # Internal debug score
    
    # Rich Phase 2 public attributes
    rank: Optional[int] = None
    delivery_time: int  # Maps to average_delivery_time_min
    match_score: int    # 0 - 100
    confidence: str     # "High", "Medium", "Low"
    reason: str         # Generated natural language description
    explanation: Optional[str] = None  # Canonical alias for deterministic explanation

class RecommendationMetadata(BaseModel):
    """Schema representing diagnostics metadata for recommendations."""
    suppliers_checked: int
    eligible_suppliers: int
    processing_time_ms: int
    model_version: str = "1.1.0"
    request_id: Optional[str] = None
    api_version: str = "v1"

class RecommendationResponse(BaseModel):
    """Schema representing the overall rich recommendation response."""
    ingredient: str
    generated_at: str
    best_supplier: Optional[SupplierRecommendation] = None
    alternatives: List[SupplierRecommendation] = []
    metadata: RecommendationMetadata

class RecommendationAuditResponse(BaseModel):
    """Schema representing a stored recommendation audit trace record."""
    id: int
    request_id: str
    user_id: Optional[int] = None
    ingredient: str
    vendor_latitude: float
    vendor_longitude: float
    suppliers_checked: int
    eligible_suppliers: int
    selected_supplier_id: Optional[str] = None
    selected_supplier_name: Optional[str] = None
    recommendation_score: Optional[float] = None
    match_score: Optional[int] = None
    processing_time_ms: int
    model_version: str
    api_version: str
    created_at: str

class RecommendationAuditListResponse(BaseModel):
    """Schema representing paginated recommendation audit traces."""
    audits: List[RecommendationAuditResponse]
    total: int
    limit: int
    offset: int
