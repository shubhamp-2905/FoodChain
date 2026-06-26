"""
FoodChain AI - Database Base

Import all models here so Alembic can detect them.
"""

from app.db.session import Base  # noqa: F401
from app.models.user import User  # noqa: F401
from app.models.supplier import Supplier  # noqa: F401
from app.models.product import Product  # noqa: F401
from app.models.supplier_inventory import SupplierInventory  # noqa: F401
