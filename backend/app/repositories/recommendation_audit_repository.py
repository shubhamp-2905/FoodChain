"""
FoodChain AI - Recommendation Audit Repository
Phase 10: Recommendation Auditability & Tracing

Encapsulates database access for storing and querying recommendation decision traces.
"""

from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models.recommendation_audit import RecommendationAudit


class RecommendationAuditRepository:
    """Repository handling CRUD operations for recommendation audits."""

    @staticmethod
    def create(db: Session, audit_record: RecommendationAudit) -> RecommendationAudit:
        """Persists a new recommendation audit record."""
        db.add(audit_record)
        db.commit()
        db.refresh(audit_record)
        return audit_record

    @staticmethod
    def get_by_request_id(db: Session, request_id: str) -> Optional[RecommendationAudit]:
        """Fetches a specific recommendation audit record by unique request_id."""
        return (
            db.query(RecommendationAudit)
            .filter(RecommendationAudit.request_id == request_id)
            .first()
        )

    @staticmethod
    def list_audits(
        db: Session,
        user_id: Optional[int] = None,
        ingredient: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[RecommendationAudit]:
        """Queries recommendation audit history with optional user and ingredient filtering."""
        query = db.query(RecommendationAudit)
        if user_id is not None:
            query = query.filter(RecommendationAudit.user_id == user_id)
        if ingredient:
            query = query.filter(RecommendationAudit.ingredient.ilike(ingredient))

        return (
            query.order_by(desc(RecommendationAudit.created_at))
            .offset(offset)
            .limit(limit)
            .all()
        )

    @staticmethod
    def count_audits(
        db: Session,
        user_id: Optional[int] = None,
        ingredient: Optional[str] = None,
    ) -> int:
        """Returns the total number of audits matching the criteria."""
        query = db.query(RecommendationAudit)
        if user_id is not None:
            query = query.filter(RecommendationAudit.user_id == user_id)
        if ingredient:
            query = query.filter(RecommendationAudit.ingredient.ilike(ingredient))

        return query.count()
