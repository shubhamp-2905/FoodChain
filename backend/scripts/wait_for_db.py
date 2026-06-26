"""
FoodChain AI - Wait for Database Connection

Utility script to wait until PostgreSQL is ready to accept connections.
"""

import sys
import time
from sqlalchemy import create_engine
from app.core.config import settings

def wait_for_db():
    """Wait for database to be ready."""
    print("⏳ Waiting for database to be ready...")
    retries = 30
    while retries > 0:
        try:
            # Attempt to connect to the database
            engine = create_engine(settings.DATABASE_URL)
            with engine.connect() as conn:
                print("🏁 Database is ready! 🎉")
                sys.exit(0)
        except Exception as e:
            print(f"⚠️ Database not ready yet ({e.__class__.__name__}). Retrying in 1 second... ({retries} retries left)")
            time.sleep(1)
            retries -= 1
            
    print("❌ Timeout waiting for database. Exiting.")
    sys.exit(1)

if __name__ == "__main__":
    wait_for_db()
