"""
FoodChain AI - Inventory Repository

Database access layer for SupplierInventory (supplier offerings).
"""

from sqlalchemy.orm import Session
from app.models.supplier_inventory import SupplierInventory
from app.models.product import Product
from app.models.supplier import Supplier


class InventoryRepository:
    """Repository handling SupplierInventory database operations."""

    @staticmethod
    def get_by_id(db: Session, inventory_id: int) -> SupplierInventory | None:
        """Fetch specific supplier inventory offering by ID."""
        return db.query(SupplierInventory).filter(SupplierInventory.id == inventory_id).first()

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
        """
        query = db.query(SupplierInventory).join(Product)

        if search:
            query = query.filter(Product.ingredient.ilike(f"%{search}%"))

        if category:
            query = query.filter(Product.category == category)

        return query.limit(limit).all()

    @staticmethod
    def get_offerings_by_ingredient(db: Session, ingredient: str) -> list[SupplierInventory]:
        """Fetch all supplier inventory offerings for a specific ingredient, joining Supplier and Product."""
        return db.query(SupplierInventory)\
            .join(Product)\
            .join(Supplier)\
            .filter(Product.ingredient.ilike(ingredient))\
            .all()
