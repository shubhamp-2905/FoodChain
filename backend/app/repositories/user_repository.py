"""
FoodChain AI - User Repository

Database access layer for User operations.
"""

from sqlalchemy.orm import Session
from app.models.user import User


class UserRepository:
    """Repository handling User database operations."""

    @staticmethod
    def get_by_id(db: Session, user_id: int) -> User | None:
        """Fetch user by primary key ID."""
        return db.query(User).filter(User.id == user_id).first()

    @staticmethod
    def get_by_email(db: Session, email: str) -> User | None:
        """Fetch user by unique email address."""
        return db.query(User).filter(User.email == email).first()

    @staticmethod
    def create(db: Session, user: User) -> User:
        """Add new user to database and commit transaction."""
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def update(db: Session, user: User, update_data: dict) -> User:
        """Update existing user properties."""
        for key, value in update_data.items():
            if value is not None:
                setattr(user, key, value)
        db.commit()
        db.refresh(user)
        return user
