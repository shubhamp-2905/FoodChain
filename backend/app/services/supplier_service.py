"""
FoodChain AI - Supplier Service

Business logic for supplier and product query operations using the Repository layer.
"""

import math
from sqlalchemy.orm import Session

from app.models.supplier import Supplier
from app.repositories.supplier_repository import SupplierRepository
from app.repositories.product_repository import ProductRepository
from app.repositories.inventory_repository import InventoryRepository
from app.core.exceptions import NotFoundException


def get_suppliers(
    db: Session,
    search: str | None = None,
    area: str | None = None,
    supplier_type: str | None = None,
    page: int = 1,
    limit: int = 12,
    user_lat: float | None = None,
    user_lon: float | None = None,
) -> dict:
    """
    Get suppliers with pagination, optional filters, and coordinates-based proximity sorting.
    """
    items, total = SupplierRepository.get_suppliers(
        db,
        search=search,
        area=area,
        supplier_type=supplier_type,
        page=page,
        limit=limit,
        user_lat=user_lat,
        user_lon=user_lon,
    )

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": math.ceil(total / limit) if total > 0 else 0,
    }


def get_supplier_by_id(db: Session, supplier_id: int) -> Supplier:
    """
    Get a single supplier by database ID.

    Raises:
        NotFoundException: If supplier not found.
    """
    supplier = SupplierRepository.get_by_id(db, supplier_id)
    if not supplier:
        raise NotFoundException("Supplier")
    return supplier


def get_products(
    db: Session,
    search: str | None = None,
    category: str | None = None,
) -> list:
    """
    Get products (as offerings in the inventory) with optional search and category.
    Returns list of offerings mapped to product-style response dicts.
    """
    offerings = InventoryRepository.get_inventory_items(db, search=search, category=category)
    
    # Flatten/map offerings into schema-compatible product dictionaries
    results = []
    for item in offerings:
        results.append({
            "id": item.id,
            "supplier_id": item.supplier_id,
            "ingredient": item.product.ingredient,
            "category": item.product.category,
            "price": item.price,
            "unit": item.product.unit,
            "stock_available": item.stock_available,
            "minimum_order": item.minimum_order,
        })
    return results


def get_ingredients(db: Session) -> list[str]:
    """Get a list of unique ingredient names sorted alphabetically."""
    return ProductRepository.get_unique_ingredients(db)
