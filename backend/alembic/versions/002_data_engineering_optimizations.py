"""Data engineering optimizations - constraints, composite indexes, functional indexes

Revision ID: 002
Revises: 001
Create Date: 2026-09-25 17:55:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # -------------------------------------------------------------
    # 1. Supplier Inventory Table: Unique constraint, Check constraints & Composite Index
    # -------------------------------------------------------------
    # Ensure (supplier_id, product_id) is unique to guarantee 1 offering per product per supplier
    op.create_unique_constraint(
        "uq_supplier_inventory_supplier_product",
        "supplier_inventory",
        ["supplier_id", "product_id"],
    )

    # Composite index for filtering by product and ordering/filtering by price
    op.create_index(
        "ix_supplier_inventory_product_price",
        "supplier_inventory",
        ["product_id", "price"],
        unique=False,
    )

    # Check constraints on numerical and business ranges
    op.create_check_constraint(
        "ck_supplier_inventory_price_positive",
        "supplier_inventory",
        "price > 0",
    )
    op.create_check_constraint(
        "ck_supplier_inventory_stock_non_negative",
        "supplier_inventory",
        "stock_available >= 0",
    )
    op.create_check_constraint(
        "ck_supplier_inventory_min_order_positive",
        "supplier_inventory",
        "minimum_order >= 1",
    )

    # -------------------------------------------------------------
    # 2. Suppliers Table: Check constraints & Geospatial Composite Index
    # -------------------------------------------------------------
    # Composite spatial index for geographic bounding box and proximity searches
    op.create_index(
        "ix_suppliers_lat_lon",
        "suppliers",
        ["latitude", "longitude"],
        unique=False,
    )

    op.create_check_constraint(
        "ck_suppliers_rating_range",
        "suppliers",
        "rating >= 0.0 AND rating <= 5.0",
    )
    op.create_check_constraint(
        "ck_suppliers_quality_score_range",
        "suppliers",
        "quality_score >= 0.0 AND quality_score <= 5.0",
    )
    op.create_check_constraint(
        "ck_suppliers_reliability_range",
        "suppliers",
        "reliability_score >= 0.0 AND reliability_score <= 100.0",
    )
    op.create_check_constraint(
        "ck_suppliers_latitude_range",
        "suppliers",
        "latitude >= -90.0 AND latitude <= 90.0",
    )
    op.create_check_constraint(
        "ck_suppliers_longitude_range",
        "suppliers",
        "longitude >= -180.0 AND longitude <= 180.0",
    )
    op.create_check_constraint(
        "ck_suppliers_delivery_radius_positive",
        "suppliers",
        "delivery_radius_km > 0.0",
    )
    op.create_check_constraint(
        "ck_suppliers_avg_delivery_time_positive",
        "suppliers",
        "average_delivery_time_min > 0",
    )

    # -------------------------------------------------------------
    # 3. Products Table: Check constraints & Functional Lower Index
    # -------------------------------------------------------------
    op.create_check_constraint(
        "ck_products_ingredient_not_empty",
        "products",
        "length(trim(ingredient)) > 0",
    )
    op.create_check_constraint(
        "ck_products_category_not_empty",
        "products",
        "length(trim(category)) > 0",
    )
    op.create_check_constraint(
        "ck_products_unit_not_empty",
        "products",
        "length(trim(unit)) > 0",
    )

    # Functional B-Tree index on lower(ingredient) for O(log N) case-insensitive exact matching
    op.execute("CREATE INDEX ix_products_ingredient_lower ON products (lower(ingredient));")

    # -------------------------------------------------------------
    # 4. Users Table: Check constraints
    # -------------------------------------------------------------
    op.create_check_constraint(
        "ck_users_latitude_range",
        "users",
        "latitude IS NULL OR (latitude >= -90.0 AND latitude <= 90.0)",
    )
    op.create_check_constraint(
        "ck_users_longitude_range",
        "users",
        "longitude IS NULL OR (longitude >= -180.0 AND longitude <= 180.0)",
    )


def downgrade() -> None:
    # Users constraints
    op.drop_constraint("ck_users_longitude_range", "users", type_="check")
    op.drop_constraint("ck_users_latitude_range", "users", type_="check")

    # Products constraints & functional index
    op.execute("DROP INDEX IF EXISTS ix_products_ingredient_lower;")
    op.drop_constraint("ck_products_unit_not_empty", "products", type_="check")
    op.drop_constraint("ck_products_category_not_empty", "products", type_="check")
    op.drop_constraint("ck_products_ingredient_not_empty", "products", type_="check")

    # Suppliers constraints & indexes
    op.drop_constraint("ck_suppliers_avg_delivery_time_positive", "suppliers", type_="check")
    op.drop_constraint("ck_suppliers_delivery_radius_positive", "suppliers", type_="check")
    op.drop_constraint("ck_suppliers_longitude_range", "suppliers", type_="check")
    op.drop_constraint("ck_suppliers_latitude_range", "suppliers", type_="check")
    op.drop_constraint("ck_suppliers_reliability_range", "suppliers", type_="check")
    op.drop_constraint("ck_suppliers_quality_score_range", "suppliers", type_="check")
    op.drop_constraint("ck_suppliers_rating_range", "suppliers", type_="check")
    op.drop_index("ix_suppliers_lat_lon", table_name="suppliers")

    # Supplier inventory constraints & indexes
    op.drop_constraint("ck_supplier_inventory_min_order_positive", "supplier_inventory", type_="check")
    op.drop_constraint("ck_supplier_inventory_stock_non_negative", "supplier_inventory", type_="check")
    op.drop_constraint("ck_supplier_inventory_price_positive", "supplier_inventory", type_="check")
    op.drop_index("ix_supplier_inventory_product_price", table_name="supplier_inventory")
    op.drop_constraint("uq_supplier_inventory_supplier_product", "supplier_inventory", type_="unique")
