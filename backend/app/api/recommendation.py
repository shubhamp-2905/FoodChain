import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.product import Product
from app.models.recommendation_audit import RecommendationAudit
from app.repositories.product_repository import ProductRepository
from app.repositories.inventory_repository import InventoryRepository
from app.repositories.recommendation_audit_repository import RecommendationAuditRepository
from app.ml import RecommendationService
from app.ml.schemas.recommendation import (
    RecommendationResponse,
    RecommendationAuditResponse,
    RecommendationAuditListResponse,
)
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
    request: Request,
    response: Response,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get machine learning recommended suppliers for a given raw material/ingredient.
    
    If latitude and longitude are omitted, uses the logged-in user's stored coordinates.
    Records an auditable provenance trace in recommendation_audits.
    """
    # 1. Trace identifier propagation
    request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
    api_version = "v1"
    response.headers["X-Request-ID"] = request_id

    # 2. Resolve coordinates
    lat = request_data.latitude
    lon = request_data.longitude

    if lat is None or lon is None:
        lat = current_user.latitude
        lon = current_user.longitude

    if lat is None or lon is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Location coordinates are missing. Please provide coordinates or enable GPS in your profile.",
        )

    # Validate coordinate ranges
    if not (-90 <= lat <= 90) or not (-180 <= lon <= 180):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid coordinates range. Latitude must be in [-90, 90] and Longitude in [-180, 180].",
        )

    # 3. Check if ingredient exists in our catalog
    product_exists = ProductRepository.get_by_ingredient(db, request_data.ingredient)
    if not product_exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ingredient '{request_data.ingredient}' is not available in our catalog.",
        )

    # 4. Retrieve all supplier inventory offerings for this ingredient
    try:
        offerings = InventoryRepository.get_offerings_by_ingredient(db, request_data.ingredient)
    except Exception as e:
        logger.error(f"Failed to query offerings from database: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve supplier offerings from database.",
        )

    # 5. Invoke the ML recommendation orchestrator
    try:
        recommendations = recommend_service.recommend(
            offerings=offerings,
            vendor_lat=lat,
            vendor_lon=lon,
            ingredient=request_data.ingredient,
            top_n=10,
            request_id=request_id,
            api_version=api_version,
        )
    except Exception as e:
        logger.error(f"Error executing recommendation engine: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error processing recommendation model.",
        )

    # 6. Record Recommendation Audit Trace (Phase 10)
    try:
        best_rec = recommendations.best_supplier
        audit_record = RecommendationAudit(
            request_id=request_id,
            user_id=current_user.id if current_user else None,
            ingredient=request_data.ingredient,
            vendor_latitude=float(lat),
            vendor_longitude=float(lon),
            suppliers_checked=recommendations.metadata.suppliers_checked,
            eligible_suppliers=recommendations.metadata.eligible_suppliers,
            selected_supplier_id=best_rec.supplier_id if best_rec else None,
            selected_supplier_name=best_rec.supplier_name if best_rec else None,
            recommendation_score=best_rec.recommendation_score if best_rec else None,
            match_score=best_rec.match_score if best_rec else None,
            processing_time_ms=recommendations.metadata.processing_time_ms,
            model_version=recommendations.metadata.model_version,
            api_version=api_version,
        )
        RecommendationAuditRepository.create(db, audit_record)
        logger.info(f"Recorded recommendation audit trace: {request_id}")
    except Exception as audit_err:
        # Audit logging failure must never fail the user's recommendation response
        logger.warning(
            f"Failed to persist recommendation audit trace [{request_id}]: {audit_err}",
            exc_info=True,
        )

    return recommendations


@router.get("/recommend/audits/{request_id}", response_model=RecommendationAuditResponse)
def get_recommendation_audit_trace(
    request_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Fetch complete audit provenance and metrics for a specific recommendation request by request_id.
    """
    audit = RecommendationAuditRepository.get_by_request_id(db, request_id)
    if not audit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Recommendation audit trace '{request_id}' not found.",
        )
    return RecommendationAuditResponse(**audit.to_dict())


@router.get("/recommend/audits", response_model=RecommendationAuditListResponse)
def list_recommendation_audits(
    ingredient: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    List past recommendation decision audit traces for auditing and operational visibility.
    """
    user_id = current_user.id if current_user else None
    items = RecommendationAuditRepository.list_audits(
        db, user_id=user_id, ingredient=ingredient, limit=limit, offset=offset
    )
    total = RecommendationAuditRepository.count_audits(
        db, user_id=user_id, ingredient=ingredient
    )

    return RecommendationAuditListResponse(
        audits=[RecommendationAuditResponse(**item.to_dict()) for item in items],
        total=total,
        limit=limit,
        offset=offset,
    )
