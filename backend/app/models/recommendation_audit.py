"""
FoodChain AI - Recommendation Audit Model
Phase 10: Recommendation Auditability & Tracing

Captures complete decision provenance and operational diagnostics for every recommendation request.
"""

from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    ForeignKey,
    CheckConstraint,
    Index,
)
from sqlalchemy.orm import relationship
from app.db.session import Base


class RecommendationAudit(Base):
    """
    Audit entity capturing request parameters, candidate filtering statistics,
    selected supplier outcomes, performance latency, and model versioning.

    Security & Privacy:
    - Zero raw PII stored (no passwords, tokens, or payment details).
    - Captures trace identifiers and operational context for auditing and debugging.
    """

    __tablename__ = "recommendation_audits"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    request_id = Column(String(64), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    ingredient = Column(String(100), nullable=False, index=True)

    # Request Coordinates
    vendor_latitude = Column(Float, nullable=False)
    vendor_longitude = Column(Float, nullable=False)

    # Candidate Funnel Diagnostics
    suppliers_checked = Column(Integer, nullable=False, default=0)
    eligible_suppliers = Column(Integer, nullable=False, default=0)

    # Top Selection Metadata
    selected_supplier_id = Column(String(50), nullable=True)
    selected_supplier_name = Column(String(200), nullable=True)
    recommendation_score = Column(Float, nullable=True)
    match_score = Column(Integer, nullable=True)

    # Performance & System Versioning
    processing_time_ms = Column(Integer, nullable=False, default=0)
    model_version = Column(String(50), nullable=False, default="1.1.0")
    api_version = Column(String(20), nullable=False, default="v1")

    # Audit Timestamp
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )

    # Relationships
    user = relationship("User", backref="recommendation_audits")

    __table_args__ = (
        CheckConstraint(
            "vendor_latitude >= -90.0 AND vendor_latitude <= 90.0",
            name="ck_rec_audit_lat_range",
        ),
        CheckConstraint(
            "vendor_longitude >= -180.0 AND vendor_longitude <= 180.0",
            name="ck_rec_audit_lon_range",
        ),
        CheckConstraint(
            "processing_time_ms >= 0",
            name="ck_rec_audit_proc_time_non_negative",
        ),
        CheckConstraint(
            "suppliers_checked >= 0",
            name="ck_rec_audit_suppliers_checked_non_negative",
        ),
        CheckConstraint(
            "eligible_suppliers >= 0",
            name="ck_rec_audit_eligible_suppliers_non_negative",
        ),
        Index("ix_rec_audit_user_created", "user_id", "created_at"),
        Index("ix_rec_audit_ingredient_created", "ingredient", "created_at"),
    )

    def to_dict(self):
        """Converts model instance to a JSON-serializable dictionary."""
        return {
            "id": self.id,
            "request_id": self.request_id,
            "user_id": self.user_id,
            "ingredient": self.ingredient,
            "vendor_latitude": self.vendor_latitude,
            "vendor_longitude": self.vendor_longitude,
            "suppliers_checked": self.suppliers_checked,
            "eligible_suppliers": self.eligible_suppliers,
            "selected_supplier_id": self.selected_supplier_id,
            "selected_supplier_name": self.selected_supplier_name,
            "recommendation_score": self.recommendation_score,
            "match_score": self.match_score,
            "processing_time_ms": self.processing_time_ms,
            "model_version": self.model_version,
            "api_version": self.api_version,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
