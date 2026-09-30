"""
FoodChain AI - Supplier Model

SQLAlchemy model for raw material suppliers.
"""

from datetime import datetime, timezone

from sqlalchemy import String, Float, Integer, DateTime, Index, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class Supplier(Base):
    """Supplier model representing a raw material supplier."""

    __tablename__ = "suppliers"
    __table_args__ = (
        Index("ix_suppliers_lat_lon", "latitude", "longitude"),
        CheckConstraint("rating IS NULL OR (rating >= 0.0 AND rating <= 5.0)", name="ck_suppliers_rating_range"),
        CheckConstraint(
            "quality_score IS NULL OR (quality_score >= 0.0 AND quality_score <= 5.0)",
            name="ck_suppliers_quality_score_range",
        ),
        CheckConstraint(
            "reliability_score IS NULL OR (reliability_score >= 0.0 AND reliability_score <= 100.0)",
            name="ck_suppliers_reliability_range",
        ),
        CheckConstraint(
            "latitude >= -90.0 AND latitude <= 90.0",
            name="ck_suppliers_latitude_range",
        ),
        CheckConstraint(
            "longitude >= -180.0 AND longitude <= 180.0",
            name="ck_suppliers_longitude_range",
        ),
        CheckConstraint(
            "delivery_radius_km > 0.0",
            name="ck_suppliers_delivery_radius_positive",
        ),
        CheckConstraint(
            "average_delivery_time_min > 0",
            name="ck_suppliers_avg_delivery_time_positive",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    supplier_id: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    supplier_name: Mapped[str] = mapped_column(String(200), nullable=False)
    supplier_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    market: Mapped[str] = mapped_column(String(100), nullable=False)
    area: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    quality_score: Mapped[float | None] = mapped_column(Float, nullable=True, default=None)
    rating: Mapped[float | None] = mapped_column(Float, nullable=True, default=None)
    reliability_score: Mapped[float | None] = mapped_column(Float, nullable=True, default=None)
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
