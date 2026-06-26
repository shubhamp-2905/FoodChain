#!/bin/sh
set -e

# Print startup banner
echo "============================================="
echo "🚀 FoodChain AI Backend Entrypoint Starting..."
echo "============================================="

# Wait for PostgreSQL database to be ready
python scripts/wait_for_db.py

# Run Alembic migrations
echo "⚙️ Applying database migrations..."
alembic upgrade head

# Run seeding script (triggers only if database tables are empty)
echo "🌱 Checking/seeding database..."
python scripts/seed_database.py

echo "🏁 Backend initialization complete. Starting server..."
echo "============================================="

# Execute the CMD instruction from Dockerfile
exec "$@"
