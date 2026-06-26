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
    quality_score: float
    rating: float
    reliability_score: float
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
    quality_score: float
    rating: float
    reliability_score: float
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
