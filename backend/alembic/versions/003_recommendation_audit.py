"""Add recommendation_audits table for decision tracing

Revision ID: 003
Revises: 002
Create Date: 2026-09-26 00:15:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # -------------------------------------------------------------
    # Create recommendation_audits table
    # -------------------------------------------------------------
    op.create_table(
        "recommendation_audits",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True, nullable=False),
        sa.Column("request_id", sa.String(length=64), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("ingredient", sa.String(length=100), nullable=False),
        sa.Column("vendor_latitude", sa.Float(), nullable=False),
        sa.Column("vendor_longitude", sa.Float(), nullable=False),
        sa.Column("suppliers_checked", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("eligible_suppliers", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("selected_supplier_id", sa.String(length=50), nullable=True),
        sa.Column("selected_supplier_name", sa.String(length=200), nullable=True),
        sa.Column("recommendation_score", sa.Float(), nullable=True),
        sa.Column("match_score", sa.Integer(), nullable=True),
        sa.Column("processing_time_ms", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("model_version", sa.String(length=50), nullable=False, server_default="1.1.0"),
        sa.Column("api_version", sa.String(length=20), nullable=False, server_default="v1"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint("vendor_latitude >= -90.0 AND vendor_latitude <= 90.0", name="ck_rec_audit_lat_range"),
        sa.CheckConstraint("vendor_longitude >= -180.0 AND vendor_longitude <= 180.0", name="ck_rec_audit_lon_range"),
        sa.CheckConstraint("processing_time_ms >= 0", name="ck_rec_audit_proc_time_non_negative"),
        sa.CheckConstraint("suppliers_checked >= 0", name="ck_rec_audit_suppliers_checked_non_negative"),
        sa.CheckConstraint("eligible_suppliers >= 0", name="ck_rec_audit_eligible_suppliers_non_negative"),
    )

    # Indexes
    op.create_index("ix_recommendation_audits_id", "recommendation_audits", ["id"], unique=False)
    op.create_index("ix_recommendation_audits_request_id", "recommendation_audits", ["request_id"], unique=True)
    op.create_index("ix_recommendation_audits_user_id", "recommendation_audits", ["user_id"], unique=False)
    op.create_index("ix_recommendation_audits_ingredient", "recommendation_audits", ["ingredient"], unique=False)
    op.create_index("ix_recommendation_audits_created_at", "recommendation_audits", ["created_at"], unique=False)
    op.create_index("ix_rec_audit_user_created", "recommendation_audits", ["user_id", "created_at"], unique=False)
    op.create_index("ix_rec_audit_ingredient_created", "recommendation_audits", ["ingredient", "created_at"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_rec_audit_ingredient_created", table_name="recommendation_audits")
    op.drop_index("ix_rec_audit_user_created", table_name="recommendation_audits")
    op.drop_index("ix_recommendation_audits_created_at", table_name="recommendation_audits")
    op.drop_index("ix_recommendation_audits_ingredient", table_name="recommendation_audits")
    op.drop_index("ix_recommendation_audits_user_id", table_name="recommendation_audits")
    op.drop_index("ix_recommendation_audits_request_id", table_name="recommendation_audits")
    op.drop_index("ix_recommendation_audits_id", table_name="recommendation_audits")
    op.drop_table("recommendation_audits")
