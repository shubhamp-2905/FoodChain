"""
FoodChain AI - Database Seeding Utility

Parses the Pune supplier CSV dataset, populates normalized tables:
1. Suppliers
2. Products (Unique catalog definitions)
3. SupplierInventory (Supplier-specific pricing and stock)
"""

import csv
import os
from sqlalchemy.orm import Session

from app.models.supplier import Supplier
from app.models.product import Product
from app.models.supplier_inventory import SupplierInventory
from app.utils.logger import logger


def seed_database(db: Session):
    """Seed database from CSV file if database is empty."""
    # Check if database is already seeded
    if db.query(Supplier).first():
        logger.info("Database already contains supplier records. Skipping seed.")
        return

    # Find the CSV file using standard fallback paths
    csv_path = None
    paths_to_check = [
        "/data/pune_supplier_dataset.csv",
        "../data/pune_supplier_dataset.csv",
        "data/pune_supplier_dataset.csv",
        "./data/pune_supplier_dataset.csv",
        "d:/Projects/Foodchain/data/pune_supplier_dataset.csv",
    ]
    for path in paths_to_check:
        if os.path.exists(path):
            csv_path = path
            break

    if not csv_path:
        logger.error("pune_supplier_dataset.csv dataset file could not be found.")
        return

    logger.info(f"Seeding database from: {csv_path}")

    suppliers_dict = {}
    products_dict = {}  # Unique key: (ingredient, category, unit) -> product fields
    inventory_items = []

    # Read CSV
    with open(csv_path, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            supplier_id_str = row["supplier_id"]
            
            # Group unique suppliers
            if supplier_id_str not in suppliers_dict:
                suppliers_dict[supplier_id_str] = {
                    "supplier_id": supplier_id_str,
                    "supplier_name": row["supplier_name"],
                    "supplier_type": row["supplier_type"],
                    "market": row["market"],
                    "area": row["area"],
                    "latitude": float(row["latitude"]),
                    "longitude": float(row["longitude"]),
                    "quality_score": float(row["quality_score"]),
                    "rating": float(row["rating"]),
                    "reliability_score": float(row["reliability_score"]),
                    "delivery_radius_km": float(row["delivery_radius_km"]),
                    "average_delivery_time_min": int(row["average_delivery_time_min"]),
                }

            # Group unique products (ingredients)
            prod_key = (row["ingredient"], row["category"], row["unit"])
            if prod_key not in products_dict:
                products_dict[prod_key] = {
                    "ingredient": row["ingredient"],
                    "category": row["category"],
                    "unit": row["unit"],
                }

            # Store inventory join specs
            inventory_items.append({
                "supplier_id_str": supplier_id_str,
                "prod_key": prod_key,
                "price": float(row["price"]),
                "stock_available": int(row["stock_available"]),
                "minimum_order": int(row["minimum_order"]),
            })

    logger.info(f"Parsed {len(suppliers_dict)} unique suppliers and {len(products_dict)} unique products from CSV.")

    # 1. Insert Suppliers
    supplier_objs = {}
    for supplier_id_str, s_data in suppliers_dict.items():
        supplier = Supplier(**s_data)
        db.add(supplier)
        supplier_objs[supplier_id_str] = supplier

    # 2. Insert Products
    product_objs = {}
    for prod_key, p_data in products_dict.items():
        product = Product(**p_data)
        db.add(product)
        product_objs[prod_key] = product

    # Flush database to obtain autoincremented primary key IDs
    db.flush()

    # 3. Insert Supplier Inventory Join Items
    for item in inventory_items:
        supplier_obj = supplier_objs[item["supplier_id_str"]]
        product_obj = product_objs[item["prod_key"]]

        inventory_entry = SupplierInventory(
            supplier_id=supplier_obj.id,
            product_id=product_obj.id,
            price=item["price"],
            stock_available=item["stock_available"],
            minimum_order=item["minimum_order"],
        )
        db.add(inventory_entry)

    # Commit all changes in a single transaction
    db.commit()
    logger.info(f"Database successfully seeded! Created {len(suppliers_dict)} suppliers, {len(products_dict)} unique products, and {len(inventory_items)} inventory records.")
