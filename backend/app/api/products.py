"""
FoodChain AI - Product Routes

GET /products - List products with optional search
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.supplier import ProductResponse
from app.services import supplier_service

router = APIRouter(prefix="/products", tags=["Products"])


@router.get("", response_model=List[ProductResponse])
def list_products(
    search: str | None = Query(None, description="Search by ingredient name"),
    category: str | None = Query(None, description="Filter by category"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get products with optional search and category filter."""
    return supplier_service.get_products(db, search=search, category=category)
