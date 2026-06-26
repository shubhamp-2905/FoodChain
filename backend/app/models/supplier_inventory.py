"""
FoodChain AI - Supplier Inventory Model

SQLAlchemy model linking suppliers and unique products with pricing and stock details.
"""

from sqlalchemy import Float, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class SupplierInventory(Base):
    """SupplierInventory model representing an offering of a product by a supplier."""

    __tablename__ = "supplier_inventory"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    supplier_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("suppliers.id", ondelete="CASCADE"), nullable=False, index=True
    )
    product_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True
    )
    price: Mapped[float] = mapped_column(Float, nullable=False)
    stock_available: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    minimum_order: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    # Relationships
    supplier = relationship("Supplier", back_populates="inventory")
    product = relationship("Product", back_populates="inventory")

    def __repr__(self) -> str:
        return f"<SupplierInventory(id={self.id}, supplier_id={self.supplier_id}, product_id={self.product_id}, price={self.price})>"
