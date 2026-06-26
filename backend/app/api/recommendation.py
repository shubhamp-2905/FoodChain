from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.product import Product
from app.repositories.inventory_repository import InventoryRepository
from app.ml import RecommendationService
from app.ml.schemas.recommendation import RecommendationResponse
from app.utils.logger import logger

router = APIRouter(tags=["Recommendations"])

# Reusable RecommendationService instance to utilize cached models
recommend_service = RecommendationService()

class RecommendationRequest(BaseModel):
    ingredient: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None

@router.post("/recommend", response_model=RecommendationResponse)
def get_recommendations(
    request_data: RecommendationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get machine learning recommended suppliers for a given raw material/ingredient.
    
    If latitude and longitude are omitted, uses the logged-in user's stored coordinates.
    """
    # 1. Resolve coordinates
    lat = request_data.latitude
    lon = request_data.longitude
    
    if lat is None or lon is None:
        lat = current_user.latitude
        lon = current_user.longitude
        
    if lat is None or lon is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Location coordinates are missing. Please provide coordinates or enable GPS in your profile."
        )
        
    # Validate coordinate ranges
    if not (-90 <= lat <= 90) or not (-180 <= lon <= 180):
         raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid coordinates range. Latitude must be in [-90, 90] and Longitude in [-180, 180]."
        )
         
    # 2. Check if ingredient exists in our catalog
    product_exists = db.query(Product).filter(Product.ingredient.ilike(request_data.ingredient)).first()
    if not product_exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ingredient '{request_data.ingredient}' is not available in our catalog."
        )
        
    # 3. Retrieve all supplier inventory offerings for this ingredient
    try:
        offerings = InventoryRepository.get_offerings_by_ingredient(db, request_data.ingredient)
    except Exception as e:
        logger.error(f"Failed to query offerings from database: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve supplier offerings from database."
        )
        
    # 4. Invoke the ML recommendation orchestrator
    try:
        recommendations = recommend_service.recommend(
            offerings=offerings,
            vendor_lat=lat,
            vendor_lon=lon,
            ingredient=request_data.ingredient,
            top_n=10
        )
    except Exception as e:
        logger.error(f"Error executing recommendation engine: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error processing recommendation model."
        )
        
    return recommendations
