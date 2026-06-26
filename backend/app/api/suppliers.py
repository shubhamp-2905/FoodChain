"""
FoodChain AI - Supplier Routes

GET /suppliers       - List/search suppliers with pagination
GET /suppliers/{id}  - Get supplier details with products
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.supplier import (
    SupplierResponse,
    PaginatedSupplierResponse,
)
from app.services import supplier_service

router = APIRouter(prefix="/suppliers", tags=["Suppliers"])


@router.get("", response_model=PaginatedSupplierResponse)
def list_suppliers(
    search: str | None = Query(None, description="Search by supplier name"),
    area: str | None = Query(None, description="Filter by area"),
    supplier_type: str | None = Query(None, description="Filter by supplier type"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(12, ge=1, le=5000, description="Items per page"),
    latitude: float | None = Query(None, ge=-90, le=90, description="User latitude for distance sorting"),
    longitude: float | None = Query(None, ge=-180, le=180, description="User longitude for distance sorting"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get paginated list of suppliers with optional search and filters."""
    result = supplier_service.get_suppliers(
        db,
        search=search,
        area=area,
        supplier_type=supplier_type,
        page=page,
        limit=limit,
        user_lat=latitude,
        user_lon=longitude,
    )
    return result


@router.get("/{supplier_id}", response_model=SupplierResponse)
def get_supplier(
    supplier_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get supplier details including products."""
    return supplier_service.get_supplier_by_id(db, supplier_id)
