"""
FoodChain AI - Ingredient Routes

GET /ingredients - List unique ingredient names
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.services import supplier_service

router = APIRouter(prefix="/ingredients", tags=["Ingredients"])


@router.get("", response_model=List[str])
def list_ingredients(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get list of unique ingredient names."""
    return supplier_service.get_ingredients(db)
