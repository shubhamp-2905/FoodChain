"""
FoodChain AI - Seed Database Command Line

Utility script to trigger database seeding.
"""

import os
import sys

# Ensure the root backend directory is in the python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import SessionLocal
from app.db.seed import seed_database
from app.utils.logger import logger

def main():
    """Run seeding logic."""
    db = SessionLocal()
    try:
        seed_database(db)
    except Exception as e:
        logger.error(f"Failed to seed database: {e}", exc_info=True)
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    main()
