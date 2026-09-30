"""
Benchmark script to measure query execution time, query plan, and query count
for the POST /recommend database flow before and after optimization.
"""

import os
import sys
import time
from sqlalchemy import event, text

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
sys.path.insert(0, backend_dir)

from app.db.session import engine, SessionLocal
from app.models.supplier_inventory import SupplierInventory
from app.models.product import Product
from app.models.supplier import Supplier
from app.repositories.inventory_repository import InventoryRepository
from app.ml.utils.preprocessing import to_dict


def benchmark_current_recommend_query(ingredient: str = "Potato", runs: int = 20):
    db = SessionLocal()

    # Track SQL queries emitted
    query_count = 0
    queries = []

    def count_queries(conn, cursor, statement, parameters, context, executemany):
        nonlocal query_count
        query_count += 1
        queries.append(statement)

    event.listen(engine, "before_cursor_execute", count_queries)

    try:
        # Step 1: Pre-warm / verify
        product = db.query(Product).filter(Product.ingredient.ilike(ingredient)).first()
        offerings = InventoryRepository.get_offerings_by_ingredient(db, ingredient)
        dicts = [to_dict(o) for o in offerings]

        # Reset count for timed run
        query_count = 0
        queries.clear()

        # Timed run
        latencies = []
        for _ in range(runs):
            # Expire session so cached objects aren't reused
            db.expire_all()
            t0 = time.perf_counter()

            # 1. Product check
            prod = db.query(Product).filter(Product.ingredient.ilike(ingredient)).first()
            # 2. Get offerings
            offs = InventoryRepository.get_offerings_by_ingredient(db, ingredient)
            # 3. Access attributes as in recommendation service
            data = [to_dict(o) for o in offs]

            t1 = time.perf_counter()
            latencies.append((t1 - t0) * 1000)

        avg_latency = sum(latencies) / len(latencies)
        min_latency = min(latencies)
        p95_latency = sorted(latencies)[int(len(latencies) * 0.95)]
        queries_per_run = query_count // runs

        print(f"--- Benchmark Results ({runs} runs) ---")
        print(f"Ingredient: '{ingredient}' (Returned {len(data)} offerings)")
        print(f"Queries per request: {queries_per_run}")
        print(f"Average latency: {avg_latency:.2f} ms")
        print(f"Min latency:     {min_latency:.2f} ms")
        print(f"P95 latency:     {p95_latency:.2f} ms")

        # Explain analyze of the query
        print("\n--- EXPLAIN ANALYZE of offerings query ---")
        explain_sql = """
            EXPLAIN (ANALYZE, BUFFERS)
            SELECT supplier_inventory.id, supplier_inventory.supplier_id, supplier_inventory.product_id, supplier_inventory.price
            FROM supplier_inventory
            JOIN products ON products.id = supplier_inventory.product_id
            JOIN suppliers ON suppliers.id = supplier_inventory.supplier_id
            WHERE lower(products.ingredient) = lower(:ingredient);
        """
        explain_res = db.execute(text(explain_sql), {"ingredient": ingredient}).fetchall()
        for row in explain_res:
            print(" ", row[0])

        return {
            "query_count": queries_per_run,
            "avg_ms": avg_latency,
            "min_ms": min_latency,
            "p95_ms": p95_latency,
            "offerings_count": len(data),
        }

    finally:
        event.remove(engine, "before_cursor_execute", count_queries)
        db.close()


if __name__ == "__main__":
    benchmark_current_recommend_query()
