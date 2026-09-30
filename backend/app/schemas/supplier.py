"""
FoodChain AI - Supplier Schemas

Pydantic v2 schemas for suppliers and products.
"""

from pydantic import BaseModel, Field
from typing import List, Optional


class ProductResponse(BaseModel):
    """Schema for product response."""

    id: int
    supplier_id: int
    ingredient: str
    category: str
    price: float
    unit: str
    stock_available: int
    minimum_order: int

    model_config = {"from_attributes": True}


class SupplierResponse(BaseModel):
    """Schema for supplier response."""

    id: int
    supplier_id: str
    supplier_name: str
    supplier_type: str
    market: str
    area: str
    latitude: float
    longitude: float
    quality_score: Optional[float] = None
    rating: Optional[float] = None
    reliability_score: Optional[float] = None
    delivery_radius_km: float
    average_delivery_time_min: int
    products: List[ProductResponse] = []

    model_config = {"from_attributes": True}


class SupplierListResponse(BaseModel):
    """Schema for supplier without products (for list views)."""

    id: int
    supplier_id: str
    supplier_name: str
    supplier_type: str
    market: str
    area: str
    latitude: float
    longitude: float
    quality_score: Optional[float] = None
    rating: Optional[float] = None
    reliability_score: Optional[float] = None
    delivery_radius_km: float
    average_delivery_time_min: int

    model_config = {"from_attributes": True}


class PaginatedSupplierResponse(BaseModel):
    """Schema for paginated supplier list."""

    items: List[SupplierListResponse]
    total: int
    page: int
    limit: int
    pages: int


class SupplierOnboardRequest(BaseModel):
    """Schema for onboarding a new supplier with an initial inventory offering."""

    supplier_name: str = Field(..., min_length=2, max_length=200)
    supplier_type: str = Field(default="Wholesaler", max_length=50)
    market: str = Field(default="Market Yard", max_length=100)
    area: str = Field(default="Market Yard", max_length=100)
    latitude: float = Field(default=18.4900, ge=-90.0, le=90.0)
    longitude: float = Field(default=73.8600, ge=-180.0, le=180.0)
    rating: Optional[float] = Field(default=None, ge=0.0, le=5.0)
    quality_score: Optional[float] = Field(default=None, ge=0.0, le=5.0)
    reliability_score: Optional[float] = Field(default=None, ge=0.0, le=100.0)
    delivery_radius_km: float = Field(default=15.0, gt=0.0)
    average_delivery_time_min: int = Field(default=45, gt=0)
    # Primary product offering for recommendation eligibility
    ingredient: str = Field(..., min_length=1, max_length=100)
    category: str = Field(default="Vegetables", max_length=50)
    price: float = Field(..., gt=0.0)
    unit: str = Field(default="kg", max_length=20)
    stock_available: int = Field(default=500, ge=0)
    minimum_order: int = Field(default=10, ge=1)


class InventoryCreateRequest(BaseModel):
    """Schema for adding or updating an inventory offering for a supplier."""

    ingredient: str = Field(..., min_length=1, max_length=100)
    category: str = Field(default="Vegetables", max_length=50)
    price: float = Field(..., gt=0.0)
    unit: str = Field(default="kg", max_length=20)
    stock_available: int = Field(default=500, ge=0)
    minimum_order: int = Field(default=10, ge=1)

