"""initial migration - create users, suppliers, products, supplier_inventory tables

Revision ID: 001
Revises:
Create Date: 2024-01-01 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- Users Table ---
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("full_name", sa.String(length=100), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("mobile_number", sa.String(length=15), nullable=False),
        sa.Column("business_name", sa.String(length=150), nullable=False),
        sa.Column("food_type", sa.String(length=50), nullable=False),
        sa.Column("latitude", sa.Float(), nullable=True),
        sa.Column("longitude", sa.Float(), nullable=True),
        sa.Column("area", sa.String(length=100), nullable=True),
        sa.Column("city", sa.String(length=100), nullable=True),
        sa.Column("state", sa.String(length=100), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)

    # --- Suppliers Table ---
    op.create_table(
        "suppliers",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("supplier_id", sa.String(length=20), nullable=False),
        sa.Column("supplier_name", sa.String(length=200), nullable=False),
        sa.Column("supplier_type", sa.String(length=50), nullable=False),
        sa.Column("market", sa.String(length=100), nullable=False),
        sa.Column("area", sa.String(length=100), nullable=False),
        sa.Column("latitude", sa.Float(), nullable=False),
        sa.Column("longitude", sa.Float(), nullable=False),
        sa.Column("quality_score", sa.Float(), nullable=False),
        sa.Column("rating", sa.Float(), nullable=False),
        sa.Column("reliability_score", sa.Float(), nullable=False),
        sa.Column("delivery_radius_km", sa.Float(), nullable=False),
        sa.Column("average_delivery_time_min", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_suppliers_supplier_id"), "suppliers", ["supplier_id"], unique=True)
    op.create_index(op.f("ix_suppliers_area"), "suppliers", ["area"], unique=False)
    op.create_index(op.f("ix_suppliers_supplier_type"), "suppliers", ["supplier_type"], unique=False)

    # --- Products Table (Normalized unique product metadata) ---
    op.create_table(
        "products",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("ingredient", sa.String(length=100), nullable=False),
        sa.Column("category", sa.String(length=50), nullable=False),
        sa.Column("unit", sa.String(length=20), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_products_ingredient"), "products", ["ingredient"], unique=True)
    op.create_index(op.f("ix_products_category"), "products", ["category"], unique=False)

    # --- Supplier Inventory Table (Join details) ---
    op.create_table(
        "supplier_inventory",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("supplier_id", sa.Integer(), nullable=False),
        sa.Column("product_id", sa.Integer(), nullable=False),
        sa.Column("price", sa.Float(), nullable=False),
        sa.Column("stock_available", sa.Integer(), nullable=False),
        sa.Column("minimum_order", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["supplier_id"], ["suppliers.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_supplier_inventory_supplier_id"), "supplier_inventory", ["supplier_id"], unique=False)
    op.create_index(op.f("ix_supplier_inventory_product_id"), "supplier_inventory", ["product_id"], unique=False)


def downgrade() -> None:
    op.drop_table("supplier_inventory")
    op.drop_table("products")
    op.drop_table("suppliers")
    op.drop_table("users")
