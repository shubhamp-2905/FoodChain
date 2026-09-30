"""
Tests for Phase 5 PostgreSQL Data Engineering Improvements:
1. Database constraints (Unique, Check constraints on supplier_inventory, suppliers, products, users)
2. Query optimization and N+1 query elimination via eager joined loading
3. Functional indexing / case-insensitive search integrity
"""

import os
import sys
import unittest

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from sqlalchemy import event, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.session import engine, SessionLocal
from app.models.supplier import Supplier
from app.models.product import Product
from app.models.supplier_inventory import SupplierInventory
from app.models.user import User
from app.repositories.inventory_repository import InventoryRepository
from app.repositories.product_repository import ProductRepository
from app.ml.utils.preprocessing import to_dict


class TestDatabaseOptimizations(unittest.TestCase):
    def setUp(self):
        self.db: Session = SessionLocal()

    def tearDown(self):
        self.db.rollback()
        self.db.close()

    def test_n_plus_one_elimination_single_query(self):
        """
        Verify that InventoryRepository.get_offerings_by_ingredient executes exactly 1 SQL query
        and that accessing .supplier and .product on all retrieved items executes 0 additional queries.
        """
        query_count = 0

        def count_queries(conn, cursor, statement, parameters, context, executemany):
            nonlocal query_count
            query_count += 1

        self.db.expire_all()
        event.listen(engine, "before_cursor_execute", count_queries)

        try:
            offerings = InventoryRepository.get_offerings_by_ingredient(self.db, "Potato")
            self.assertGreater(len(offerings), 0)

            # Query count should be exactly 1 for the main joined query
            self.assertEqual(query_count, 1, f"Expected 1 query, but executed {query_count}")

            # Accessing relationships for all offerings must emit 0 additional queries
            query_count_before_access = query_count
            for off in offerings:
                self.assertIsNotNone(off.supplier)
                self.assertIsNotNone(off.product)
                d = to_dict(off)
                self.assertEqual(d["ingredient"].lower(), "potato")

            # Must still be exactly 1 query total!
            self.assertEqual(
                query_count,
                query_count_before_access,
                "Accessing .supplier or .product triggered additional queries (N+1 regression)!",
            )
        finally:
            event.remove(engine, "before_cursor_execute", count_queries)

    def test_unique_constraint_supplier_product(self):
        """
        Verify that attempting to insert duplicate (supplier_id, product_id)
        violates uq_supplier_inventory_supplier_product.
        """
        first_offering = self.db.query(SupplierInventory).first()
        self.assertIsNotNone(first_offering)

        dup = SupplierInventory(
            supplier_id=first_offering.supplier_id,
            product_id=first_offering.product_id,
            price=99.99,
            stock_available=10,
            minimum_order=1,
        )
        self.db.add(dup)
        with self.assertRaises(IntegrityError):
            self.db.commit()
        self.db.rollback()

    def test_check_constraint_price_positive(self):
        """Verify that price <= 0 violates ck_supplier_inventory_price_positive."""
        supp = self.db.query(Supplier).first()
        prod = self.db.query(Product).first()

        # Try negative price
        invalid_offering = SupplierInventory(
            supplier_id=supp.id,
            product_id=prod.id,
            price=-10.0,
            stock_available=10,
            minimum_order=1,
        )
        self.db.add(invalid_offering)
        with self.assertRaises(IntegrityError):
            self.db.commit()
        self.db.rollback()

    def test_check_constraint_minimum_order(self):
        """Verify that minimum_order < 1 violates ck_supplier_inventory_min_order_positive."""
        supp = self.db.query(Supplier).first()
        prod = self.db.query(Product).first()

        invalid_offering = SupplierInventory(
            supplier_id=supp.id,
            product_id=prod.id,
            price=25.0,
            stock_available=10,
            minimum_order=0,
        )
        self.db.add(invalid_offering)
        with self.assertRaises(IntegrityError):
            self.db.commit()
        self.db.rollback()

    def test_check_constraint_supplier_rating_range(self):
        """Verify that supplier rating > 5.0 violates ck_suppliers_rating_range."""
        invalid_supplier = Supplier(
            supplier_id="TEST_SUPP_INV1",
            supplier_name="Invalid Supplier",
            supplier_type="Wholesaler",
            market="Test Market",
            area="Test Area",
            latitude=18.52,
            longitude=73.85,
            rating=6.5,  # Invalid: > 5.0
            quality_score=4.5,
            reliability_score=90.0,
            delivery_radius_km=5.0,
            average_delivery_time_min=20,
        )
        self.db.add(invalid_supplier)
        with self.assertRaises(IntegrityError):
            self.db.commit()
        self.db.rollback()

    def test_check_constraint_supplier_delivery_radius(self):
        """Verify that supplier delivery_radius <= 0 violates ck_suppliers_delivery_radius_positive."""
        invalid_supplier = Supplier(
            supplier_id="TEST_SUPP_INV2",
            supplier_name="Invalid Radius Supplier",
            supplier_type="Wholesaler",
            market="Test Market",
            area="Test Area",
            latitude=18.52,
            longitude=73.85,
            rating=4.5,
            quality_score=4.5,
            reliability_score=90.0,
            delivery_radius_km=0.0,  # Invalid: must be > 0
            average_delivery_time_min=20,
        )
        self.db.add(invalid_supplier)
        with self.assertRaises(IntegrityError):
            self.db.commit()
        self.db.rollback()

    def test_product_case_insensitive_lookup(self):
        """Verify that ProductRepository.get_by_ingredient matches regardless of case and trimming."""
        prod1 = ProductRepository.get_by_ingredient(self.db, "potato")
        prod2 = ProductRepository.get_by_ingredient(self.db, "POTATO")
        prod3 = ProductRepository.get_by_ingredient(self.db, "  Potato  ")

        self.assertIsNotNone(prod1)
        self.assertEqual(prod1.id, prod2.id)
        self.assertEqual(prod1.id, prod3.id)


if __name__ == "__main__":
    unittest.main()
