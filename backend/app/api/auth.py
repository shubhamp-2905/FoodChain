"""
FoodChain AI - Auth Routes

POST /auth/register - Register a new user
POST /auth/login    - Login and get JWT token
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.auth import RegisterRequest, LoginRequest, AuthResponse
from app.schemas.user import UserProfileResponse
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=AuthResponse, status_code=201)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new street food vendor."""
    user, token = auth_service.register_user(db, data)
    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user=UserProfileResponse.model_validate(user),
    )


@router.post("/login", response_model=AuthResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    """Login with email and password."""
    user, token = auth_service.authenticate_user(db, data)
    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user=UserProfileResponse.model_validate(user),
    )
