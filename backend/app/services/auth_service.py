"""
FoodChain AI - Auth Service

Business logic for authentication, calling UserRepository for DB transactions.
"""

from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.auth import RegisterRequest, LoginRequest
from app.repositories.user_repository import UserRepository
from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.exceptions import DuplicateException, UnauthorizedException
from app.utils.logger import logger


def register_user(db: Session, data: RegisterRequest) -> tuple[User, str]:
    """
    Register a new user, saving readable location (area, city, state) alongside coordinates.
    """
    # Check for existing email using repository
    existing = UserRepository.get_by_email(db, data.email)
    if existing:
        raise DuplicateException("A user with this email already exists")

    # Construct user model
    role = getattr(data, "role", "vendor") or "vendor"
    if role not in ("vendor", "supplier"):
        role = "vendor"

    user = User(
        full_name=data.full_name,
        email=data.email,
        hashed_password=get_password_hash(data.password),
        mobile_number=data.mobile_number,
        business_name=data.business_name,
        food_type=data.food_type,
        latitude=data.latitude,
        longitude=data.longitude,
        area=data.area,
        city=data.city,
        state=data.state,
        role=role,
    )

    # Save via repository
    user = UserRepository.create(db, user)

    logger.info(f"User registered: {user.email} (ID: {user.id})")

    # Generate token with role embedded
    token = create_access_token(subject=user.id, role=user.role)

    return user, token


def authenticate_user(db: Session, data: LoginRequest) -> tuple[User, str]:
    """
    Authenticate a user with credentials.
    """
    user = UserRepository.get_by_email(db, data.email)

    if not user:
        raise UnauthorizedException("Invalid email or password")

    if not verify_password(data.password, user.hashed_password):
        raise UnauthorizedException("Invalid email or password")

    logger.info(f"User authenticated: {user.email} (ID: {user.id})")

    # Generate token with role embedded
    token = create_access_token(subject=user.id, role=user.role)

    return user, token
