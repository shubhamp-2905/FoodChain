"""Make rating, quality_score, and reliability_score nullable in suppliers table

Revision ID: 005
Revises: 004
Create Date: 2024-01-01 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "005"
down_revision: Union[str, None] = "004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column("suppliers", "rating", nullable=True)
    op.alter_column("suppliers", "quality_score", nullable=True)
    op.alter_column("suppliers", "reliability_score", nullable=True)


def downgrade() -> None:
    op.alter_column("suppliers", "rating", nullable=False, server_default="0.0")
    op.alter_column("suppliers", "quality_score", nullable=False, server_default="0.0")
    op.alter_column("suppliers", "reliability_score", nullable=False, server_default="0.0")
