import os
import sys

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
sys.path.insert(0, backend_dir)

from app.db.session import engine
from sqlalchemy import text

with engine.connect() as conn:
    tables = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")).fetchall()
    print("Tables in public schema:")
    for t in tables:
        name = t[0]
        cnt = conn.execute(text(f'SELECT count(*) FROM "{name}"')).scalar()
        print(f"  {name}: {cnt} rows")

    # Check existing indexes on supplier_inventory, suppliers, products
    print("\nExisting indexes:")
    indexes = conn.execute(text("""
        SELECT tablename, indexname, indexdef
        FROM pg_indexes
        WHERE schemaname = 'public'
        ORDER BY tablename, indexname;
    """)).fetchall()
    for row in indexes:
        print(f"  [{row[0]}] {row[1]}: {row[2]}")

    # Check constraints
    print("\nExisting check/unique/foreign key constraints:")
    constraints = conn.execute(text("""
        SELECT conrelid::regclass AS table_name, conname, pg_get_constraintdef(c.oid)
        FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
        ORDER BY table_name, conname;
    """)).fetchall()
    for row in constraints:
        print(f"  [{row[0]}] {row[1]}: {row[2]}")
