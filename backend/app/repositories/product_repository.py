"""
FoodChain AI - Product Repository

Database access layer for unique Product operations.
"""

from sqlalchemy.orm import Session
from app.models.product import Product


class ProductRepository:
    """Repository handling unique Product database operations."""

    @staticmethod
    def get_by_id(db: Session, product_id: int) -> Product | None:
        """Fetch unique product catalog item by ID."""
        return db.query(Product).filter(Product.id == product_id).first()

    @staticmethod
    def get_by_ingredient(db: Session, ingredient: str) -> Product | None:
        """Fetch unique product by exact ingredient name (case-insensitive)."""
        return db.query(Product).filter(
            Product.ingredient.ilike(ingredient)
        ).first()

    @staticmethod
    def create(db: Session, product: Product) -> Product:
        """Create new unique product catalog definition."""
        db.add(product)
        return product

    @staticmethod
    def get_unique_ingredients(db: Session) -> list[str]:
        """Fetch all unique ingredient names sorted alphabetically."""
        results = (
            db.query(Product.ingredient)
            .distinct()
            .order_by(Product.ingredient)
            .all()
        )
        return [r[0] for r in results]
