"""
FoodChain AI - User Service

Business logic for user profile operations, invoking UserRepository.
"""

from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UpdateProfileRequest, ChangePasswordRequest
from app.repositories.user_repository import UserRepository
from app.core.exceptions import NotFoundException, UnauthorizedException
from app.core.security import verify_password, get_password_hash
from app.utils.logger import logger


def get_user_by_id(db: Session, user_id: int) -> User:
    """
    Get a user by ID.

    Raises:
        NotFoundException: If user not found.
    """
    user = UserRepository.get_by_id(db, user_id)
    if not user:
        raise NotFoundException("User")
    return user


def update_user_profile(db: Session, user_id: int, data: UpdateProfileRequest) -> User:
    """
    Update user profile fields (including area, city, state).
    """
    user = get_user_by_id(db, user_id)

    # Exclude fields not set in request
    update_data = data.model_dump(exclude_unset=True)

    # Apply updates using repository
    user = UserRepository.update(db, user, update_data)

    logger.info(f"Profile updated: {user.email} (ID: {user.id})")

    return user


def change_user_password(db: Session, user_id: int, data: ChangePasswordRequest) -> User:
    """
    Change user password.
    """
    user = get_user_by_id(db, user_id)

    if not verify_password(data.current_password, user.hashed_password):
        raise UnauthorizedException("Incorrect current password")

    user = UserRepository.update(db, user, {"hashed_password": get_password_hash(data.new_password)})

    logger.info(f"Password changed for user: {user.email} (ID: {user.id})")

    return user

