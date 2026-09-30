"""
FoodChain AI - Supplier Account API

Self-service endpoints for supplier-role users to manage their own
business profile and inventory (CRUD). Only the owning account may
modify their records.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.deps import get_current_supplier, get_current_user
from app.models.user import User
from app.models.supplier import Supplier
from app.models.product import Product
from app.models.supplier_inventory import SupplierInventory
from app.schemas.supplier import (
    SupplierResponse,
    InventoryCreateRequest,
    ProductResponse,
)
from app.repositories.supplier_repository import SupplierRepository
from app.repositories.product_repository import ProductRepository

router = APIRouter(prefix="/supplier-account", tags=["Supplier Account"])


def _get_my_supplier(current_user: User, db: Session) -> Supplier:
    """Resolve the Supplier record owned by the current supplier-role user."""
    if not current_user.supplier_profile_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No supplier profile linked to this account. "
            "Please contact support or complete onboarding.",
        )
    supplier = SupplierRepository.get_by_id(db, current_user.supplier_profile_id)
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier profile not found. The record may have been deleted.",
        )
    return supplier


@router.get("/me", response_model=SupplierResponse)
def get_my_supplier_profile(
    current_user: User = Depends(get_current_supplier),
    db: Session = Depends(get_db),
) -> SupplierResponse:
    """Get the supplier profile linked to the authenticated supplier account."""
    supplier = _get_my_supplier(current_user, db)
    return SupplierResponse.model_validate(supplier)


@router.post("/claim/{supplier_id}", response_model=SupplierResponse)
def claim_supplier_profile(
    supplier_id: int,
    current_user: User = Depends(get_current_supplier),
    db: Session = Depends(get_db),
) -> SupplierResponse:
    """
    Link an unclaimed supplier profile to the authenticated supplier account.

    Security & Ownership Rules:
    1. Caller must have role='supplier' (enforced via get_current_supplier).
    2. Caller cannot reassign an already-linked profile: if current_user.supplier_profile_id
       is already set and differs from supplier_id, reject with 409 Conflict.
    3. Idempotency: if caller already claimed this exact supplier_id, return it successfully.
    4. Target profile must exist: if not found in DB, return 404 Not Found.
    5. Target profile must be unclaimed: if another user account has already claimed this
       supplier_id, reject with 409 Conflict.
    """
    # 1. Prevent caller from reassigning an already-linked profile
    if current_user.supplier_profile_id is not None:
        if current_user.supplier_profile_id == supplier_id:
            supplier = SupplierRepository.get_by_id(db, supplier_id)
            if not supplier:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Supplier profile not found.",
                )
            return SupplierResponse.model_validate(supplier)
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Your account is already linked to a supplier profile. Reassignment is not permitted.",
        )

    # 2. Check target profile existence
    supplier = SupplierRepository.get_by_id(db, supplier_id)
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier profile not found.",
        )

    # 3. Check if target profile is already claimed by another user account
    claimed_by = (
        db.query(User)
        .filter(User.supplier_profile_id == supplier.id, User.id != current_user.id)
        .first()
    )
    if claimed_by:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This supplier profile has already been claimed by another account.",
        )

    # 4. Link profile to current user
    current_user.supplier_profile_id = supplier.id
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return SupplierResponse.model_validate(supplier)


@router.get("/me/inventory", response_model=list[ProductResponse])
def get_my_inventory(
    current_user: User = Depends(get_current_supplier),
    db: Session = Depends(get_db),
) -> list[ProductResponse]:
    """Get all inventory items belonging to the authenticated supplier."""
    supplier = _get_my_supplier(current_user, db)
    return [
        ProductResponse(
            id=item.id,
            supplier_id=supplier.id,
            ingredient=item.product.ingredient,
            category=item.product.category,
            price=item.price,
            unit=item.product.unit,
            stock_available=item.stock_available,
            minimum_order=item.minimum_order,
        )
        for item in supplier.inventory
    ]


@router.post(
    "/me/inventory",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_my_inventory_item(
    data: InventoryCreateRequest,
    current_user: User = Depends(get_current_supplier),
    db: Session = Depends(get_db),
) -> ProductResponse:
    """Add a new inventory offering for the authenticated supplier."""
    supplier = _get_my_supplier(current_user, db)

    # Find or create the product record
    product = ProductRepository.get_by_ingredient(db, data.ingredient)
    if not product:
        product = Product(
            ingredient=data.ingredient.strip().title(),
            category=data.category,
            unit=data.unit,
        )
        db.add(product)
        db.flush()

    # Prevent duplicate ingredient listings for same supplier
    existing = (
        db.query(SupplierInventory)
        .filter(
            SupplierInventory.supplier_id == supplier.id,
            SupplierInventory.product_id == product.id,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"You already offer '{data.ingredient}'. Use PUT to update.",
        )

    inv = SupplierInventory(
        supplier_id=supplier.id,
        product_id=product.id,
        price=data.price,
        stock_available=data.stock_available,
        minimum_order=data.minimum_order,
    )
    db.add(inv)
    db.commit()
    db.refresh(inv)

    return ProductResponse(
        id=inv.id,
        supplier_id=supplier.id,
        ingredient=product.ingredient,
        category=product.category,
        price=inv.price,
        unit=product.unit,
        stock_available=inv.stock_available,
        minimum_order=inv.minimum_order,
    )


@router.put("/me/inventory/{inventory_id}", response_model=ProductResponse)
def update_my_inventory_item(
    inventory_id: int,
    data: InventoryCreateRequest,
    current_user: User = Depends(get_current_supplier),
    db: Session = Depends(get_db),
) -> ProductResponse:
    """Update price/stock for an existing inventory offering owned by this supplier."""
    supplier = _get_my_supplier(current_user, db)

    inv = db.query(SupplierInventory).filter(
        SupplierInventory.id == inventory_id,
        SupplierInventory.supplier_id == supplier.id,
    ).first()

    if not inv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory item not found or does not belong to your account.",
        )

    # Update mutable fields
    inv.price = data.price
    inv.stock_available = data.stock_available
    inv.minimum_order = data.minimum_order

    db.commit()
    db.refresh(inv)

    return ProductResponse(
        id=inv.id,
        supplier_id=supplier.id,
        ingredient=inv.product.ingredient,
        category=inv.product.category,
        price=inv.price,
        unit=inv.product.unit,
        stock_available=inv.stock_available,
        minimum_order=inv.minimum_order,
    )


@router.delete("/me/inventory/{inventory_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_my_inventory_item(
    inventory_id: int,
    current_user: User = Depends(get_current_supplier),
    db: Session = Depends(get_db),
) -> None:
    """Remove an inventory offering owned by this supplier."""
    supplier = _get_my_supplier(current_user, db)

    inv = db.query(SupplierInventory).filter(
        SupplierInventory.id == inventory_id,
        SupplierInventory.supplier_id == supplier.id,
    ).first()

    if not inv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory item not found or does not belong to your account.",
        )

    db.delete(inv)
    db.commit()
