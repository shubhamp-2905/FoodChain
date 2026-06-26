"""
FoodChain AI - Supplier Repository

Database access layer for Supplier operations.
"""

from sqlalchemy import or_, func
from sqlalchemy.orm import Session
from app.models.supplier import Supplier


class SupplierRepository:
    """Repository handling Supplier database operations."""

    @staticmethod
    def get_by_id(db: Session, id: int) -> Supplier | None:
        """Fetch supplier by primary key ID."""
        return db.query(Supplier).filter(Supplier.id == id).first()

    @staticmethod
    def get_by_supplier_id(db: Session, supplier_id: str) -> Supplier | None:
        """Fetch supplier by custom unique supplier ID string."""
        return db.query(Supplier).filter(Supplier.supplier_id == supplier_id).first()

    @staticmethod
    def create(db: Session, supplier: Supplier) -> Supplier:
        """Save a new supplier."""
        db.add(supplier)
        return supplier

    @staticmethod
    def get_suppliers(
        db: Session,
        search: str | None = None,
        area: str | None = None,
        supplier_type: str | None = None,
        page: int = 1,
        limit: int = 12,
        user_lat: float | None = None,
        user_lon: float | None = None,
    ) -> tuple[list[Supplier], int]:
        """
        Fetch suppliers with search, filtering, pagination, and optional location sorting.

        Returns:
            Tuple of (items, total_count).
        """
        query = db.query(Supplier)

        # Apply search filter (name or supplier_id)
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    Supplier.supplier_name.ilike(search_term),
                    Supplier.supplier_id.ilike(search_term),
                )
            )

        # Apply area filter
        if area:
            query = query.filter(Supplier.area == area)

        # Apply supplier type filter
        if supplier_type:
            query = query.filter(Supplier.supplier_type == supplier_type)

        # Get total count before pagination
        total = query.count()

        # Sort order
        if user_lat is not None and user_lon is not None:
            # Sort by distance (Euclidean approximation is fast and correct for ordering local areas)
            distance_expr = func.sqrt(
                func.power(Supplier.latitude - user_lat, 2)
                + func.power(Supplier.longitude - user_lon, 2)
            )
            query = query.order_by(distance_expr.asc(), Supplier.rating.desc())
        else:
            # Fallback to rating sorting
            query = query.order_by(Supplier.rating.desc())

        # Paginate results
        offset = (page - 1) * limit
        items = query.offset(offset).limit(limit).all()

        return items, total
