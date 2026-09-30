"""
FoodChain AI - Product Model

SQLAlchemy model for unique products (ingredients).
"""

from sqlalchemy import String, Integer, CheckConstraint, Index, func, column
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class Product(Base):
    """Product model representing a unique raw material / ingredient."""

    __tablename__ = "products"
    __table_args__ = (
        Index("ix_products_ingredient_lower", func.lower(column("ingredient"))),
        CheckConstraint(
            "length(trim(ingredient)) > 0", name="ck_products_ingredient_not_empty"
        ),
        CheckConstraint(
            "length(trim(category)) > 0", name="ck_products_category_not_empty"
        ),
        CheckConstraint("length(trim(unit)) > 0", name="ck_products_unit_not_empty"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ingredient: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    category: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    unit: Mapped[str] = mapped_column(String(20), nullable=False)

    # Relationship to supplier inventory
    inventory = relationship("SupplierInventory", back_populates="product", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Product(id={self.id}, ingredient={self.ingredient}, category={self.category})>"
