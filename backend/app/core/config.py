"""
FoodChain AI - Application Configuration

Centralized configuration using Pydantic Settings.
All values are loaded from environment variables.
"""

from pydantic_settings import BaseSettings
from typing import List
import json


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # --- Database ---
    DATABASE_URL: str = "postgresql://foodchain:foodchain_secret_2024@db:5432/foodchain_db"

    # --- JWT Auth ---
    SECRET_KEY: str = "foodchain-dev-secret-key-change-in-production-2024"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # --- CORS ---
    BACKEND_CORS_ORIGINS: str = '["http://localhost:3000","http://frontend:3000"]'

    @property
    def cors_origins(self) -> List[str]:
        """Parse CORS origins from JSON string."""
        try:
            return json.loads(self.BACKEND_CORS_ORIGINS)
        except (json.JSONDecodeError, TypeError):
            return ["http://localhost:3000"]

    # --- App Info ---
    APP_NAME: str = "FoodChain AI"
    APP_VERSION: str = "1.0.0"
    API_PREFIX: str = ""

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"


# Singleton instance
settings = Settings()
