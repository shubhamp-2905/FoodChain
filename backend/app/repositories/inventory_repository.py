"""
FoodChain AI - Inventory Repository

Database access layer for SupplierInventory (supplier offerings).
"""

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload
from app.models.supplier_inventory import SupplierInventory
from app.models.product import Product
from app.models.supplier import Supplier


class InventoryRepository:
    """Repository handling SupplierInventory database operations."""

    @staticmethod
    def get_by_id(db: Session, inventory_id: int) -> SupplierInventory | None:
        """Fetch specific supplier inventory offering by ID with eager loading."""
        return (
            db.query(SupplierInventory)
            .options(
                joinedload(SupplierInventory.supplier),
                joinedload(SupplierInventory.product),
            )
            .filter(SupplierInventory.id == inventory_id)
            .first()
        )

    @staticmethod
    def create(db: Session, item: SupplierInventory) -> SupplierInventory:
        """Create new supplier inventory offering."""
        db.add(item)
        return item

    @staticmethod
    def get_inventory_items(
        db: Session,
        search: str | None = None,
        category: str | None = None,
        limit: int = 100,
    ) -> list[SupplierInventory]:
        """
        Fetch supplier offerings, joining Product to support search and category filters.
        Eagerly loads product and supplier to prevent N+1 queries in consumer services.
        """
        query = (
            db.query(SupplierInventory)
            .join(SupplierInventory.product)
            .options(
                joinedload(SupplierInventory.product),
                joinedload(SupplierInventory.supplier),
            )
        )

        if search:
            query = query.filter(Product.ingredient.ilike(f"%{search.strip()}%"))

        if category:
            query = query.filter(Product.category == category)

        return query.limit(limit).all()

    @staticmethod
    def get_offerings_by_ingredient(db: Session, ingredient: str) -> list[SupplierInventory]:
        """
        Fetch all supplier inventory offerings for a specific ingredient, joining Supplier and Product.
        Uses joinedload to eagerly fetch related Supplier and Product objects in a single query,
        eliminating N+1 query cascades, and matches on lower(ingredient) for index acceleration.
        """
        clean_ingredient = ingredient.strip().lower()
        return (
            db.query(SupplierInventory)
            .join(SupplierInventory.product)
            .join(SupplierInventory.supplier)
            .options(
                joinedload(SupplierInventory.supplier),
                joinedload(SupplierInventory.product),
            )
            .filter(func.lower(Product.ingredient) == clean_ingredient)
            .all()
        )
