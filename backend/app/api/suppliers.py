from uuid import uuid4
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.supplier import Supplier
from app.models.product import Product
from app.models.supplier_inventory import SupplierInventory
from app.schemas.supplier import (
    SupplierResponse,
    PaginatedSupplierResponse,
    SupplierOnboardRequest,
    InventoryCreateRequest,
    ProductResponse,
)
from app.repositories.supplier_repository import SupplierRepository
from app.repositories.product_repository import ProductRepository
from app.services import supplier_service
from data_pipeline.services.onboarding_service import SupplierOnboardingService

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


@router.post("/onboard", response_model=SupplierResponse, status_code=status.HTTP_201_CREATED)
def onboard_supplier(
    data: SupplierOnboardRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Onboard a real supplier and initial inventory offering through the Medallion Data Pipeline.
    Validates data via Bronze -> Silver -> Gold and persists to PostgreSQL.
    """
    # 1. Generate unique business key for supplier
    supplier_id_str = f"SUP_REAL_{uuid4().hex[:6].upper()}"

    payload = {
        "supplier_id": supplier_id_str,
        "supplier_name": data.supplier_name,
        "supplier_type": data.supplier_type,
        "market": data.market,
        "area": data.area,
        "latitude": data.latitude,
        "longitude": data.longitude,
        "rating": data.rating,
        "quality_score": data.quality_score,
        "reliability_score": data.reliability_score,
        "delivery_radius_km": data.delivery_radius_km,
        "average_delivery_time_min": data.average_delivery_time_min,
        "ingredient": data.ingredient,
        "category": data.category,
        "price": data.price,
        "unit": data.unit,
        "stock_available": data.stock_available,
        "minimum_order": data.minimum_order,
    }

    # 2. Run Medallion Ingestion Pipeline validation & curation
    onboarding_service = SupplierOnboardingService()
    result = onboarding_service.onboard_supplier(payload)

    if not result.success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Supplier onboarding rejected by data quality pipeline: {result.error_message}",
        )

    # 3. Persist curated record to PostgreSQL
    new_supplier = Supplier(
        supplier_id=supplier_id_str,
        supplier_name=data.supplier_name,
        supplier_type=data.supplier_type,
        market=data.market,
        area=data.area,
        latitude=data.latitude,
        longitude=data.longitude,
        rating=data.rating,
        quality_score=data.quality_score,
        reliability_score=data.reliability_score,
        delivery_radius_km=data.delivery_radius_km,
        average_delivery_time_min=data.average_delivery_time_min,
    )
    db.add(new_supplier)
    db.flush()

    # Find or create unique product
    product = ProductRepository.get_by_ingredient(db, data.ingredient)
    if not product:
        product = Product(
            ingredient=data.ingredient.strip().title(),
            category=data.category,
            unit=data.unit,
        )
        db.add(product)
        db.flush()

    # Create supplier inventory item
    inventory = SupplierInventory(
        supplier_id=new_supplier.id,
        product_id=product.id,
        price=data.price,
        stock_available=data.stock_available,
        minimum_order=data.minimum_order,
    )
    db.add(inventory)
    db.commit()
    db.refresh(new_supplier)

    # If the requesting user has role=supplier and does not yet have a linked profile,
    # bind this new supplier record to their account so /supplier-account/me works.
    if getattr(current_user, "role", "vendor") == "supplier" and not current_user.supplier_profile_id:
        current_user.supplier_profile_id = new_supplier.id
        db.add(current_user)
        db.commit()

    return supplier_service.get_supplier_by_id(db, new_supplier.id)


@router.post("/{supplier_id}/inventory", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def add_supplier_inventory(
    supplier_id: int,
    data: InventoryCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Add or update inventory offering for a supplier through the Medallion Data Pipeline.
    Validates data via Bronze -> Silver -> Gold and updates PostgreSQL.
    """
    supplier = SupplierRepository.get_by_id(db, supplier_id)
    if not supplier:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Supplier not found")

    payload = {
        "supplier_id": supplier.supplier_id,
        "supplier_name": supplier.supplier_name,
        "supplier_type": supplier.supplier_type,
        "market": supplier.market,
        "area": supplier.area,
        "latitude": supplier.latitude,
        "longitude": supplier.longitude,
        "rating": supplier.rating,
        "quality_score": supplier.quality_score,
        "reliability_score": supplier.reliability_score,
        "delivery_radius_km": supplier.delivery_radius_km,
        "average_delivery_time_min": supplier.average_delivery_time_min,
        "ingredient": data.ingredient,
        "category": data.category,
        "price": data.price,
        "unit": data.unit,
        "stock_available": data.stock_available,
        "minimum_order": data.minimum_order,
    }

    # Run data pipeline update
    onboarding_service = SupplierOnboardingService()
    result = onboarding_service.update_inventory(payload)

    if not result.success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Inventory update rejected by data quality pipeline: {result.error_message}",
        )

    # Persist or update in PostgreSQL
    product = ProductRepository.get_by_ingredient(db, data.ingredient)
    if not product:
        product = Product(
            ingredient=data.ingredient.strip().title(),
            category=data.category,
            unit=data.unit,
        )
        db.add(product)
        db.flush()

    existing_inv = (
        db.query(SupplierInventory)
        .filter(
            SupplierInventory.supplier_id == supplier.id,
            SupplierInventory.product_id == product.id,
        )
        .first()
    )

    if existing_inv:
        existing_inv.price = data.price
        existing_inv.stock_available = data.stock_available
        existing_inv.minimum_order = data.minimum_order
        target_inv = existing_inv
    else:
        new_inv = SupplierInventory(
            supplier_id=supplier.id,
            product_id=product.id,
            price=data.price,
            stock_available=data.stock_available,
            minimum_order=data.minimum_order,
        )
        db.add(new_inv)
        target_inv = new_inv

    db.commit()
    db.refresh(target_inv)

    return ProductResponse(
        id=target_inv.id,
        supplier_id=supplier.id,
        ingredient=product.ingredient,
        category=product.category,
        price=target_inv.price,
        unit=product.unit,
        stock_available=target_inv.stock_available,
        minimum_order=target_inv.minimum_order,
    )
