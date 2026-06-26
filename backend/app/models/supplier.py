"""
FoodChain AI - Supplier Model

SQLAlchemy model for raw material suppliers.
"""

from datetime import datetime, timezone

from sqlalchemy import String, Float, Integer, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class Supplier(Base):
    """Supplier model representing a raw material supplier."""

    __tablename__ = "suppliers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    supplier_id: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    supplier_name: Mapped[str] = mapped_column(String(200), nullable=False)
    supplier_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    market: Mapped[str] = mapped_column(String(100), nullable=False)
    area: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    quality_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    rating: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    reliability_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    delivery_radius_km: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    average_delivery_time_min: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationship to inventory
    inventory = relationship("SupplierInventory", back_populates="supplier", lazy="selectin", cascade="all, delete-orphan")

    @property
    def products(self) -> list[dict]:
        """Expose normalized inventory items as simple product dicts for schema compatibility."""
        return [
            {
                "id": item.id,
                "supplier_id": item.supplier_id,
                "ingredient": item.product.ingredient,
                "category": item.product.category,
                "price": item.price,
                "unit": item.product.unit,
                "stock_available": item.stock_available,
                "minimum_order": item.minimum_order,
            }
            for item in self.inventory
        ]

    def __repr__(self) -> str:
        return f"<Supplier(id={self.id}, name={self.supplier_name}, area={self.area})>"
