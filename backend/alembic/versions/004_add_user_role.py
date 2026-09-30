"""Add role and supplier_profile_id to users table

Revision ID: 004
Revises: 003
Create Date: 2024-01-01 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add role column with default 'vendor' so existing users keep access
    op.add_column(
        "users",
        sa.Column(
            "role",
            sa.String(length=20),
            nullable=False,
            server_default="vendor",
        ),
    )
    # Add nullable FK to suppliers — only populated for supplier-role accounts
    op.add_column(
        "users",
        sa.Column("supplier_profile_id", sa.Integer(), nullable=True),
    )
    op.create_foreign_key(
        "fk_users_supplier_profile_id",
        "users",
        "suppliers",
        ["supplier_profile_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index("ix_users_role", "users", ["role"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_users_role", table_name="users")
    op.drop_constraint("fk_users_supplier_profile_id", "users", type_="foreignkey")
    op.drop_column("users", "supplier_profile_id")
    op.drop_column("users", "role")
