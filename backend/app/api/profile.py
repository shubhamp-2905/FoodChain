"""
FoodChain AI - Profile Routes

GET /profile  - Get current user's profile
PUT /profile  - Update current user's profile
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.user import UserProfileResponse, UpdateProfileRequest, ChangePasswordRequest
from app.services import user_service

router = APIRouter(prefix="/profile", tags=["Profile"])


@router.get("", response_model=UserProfileResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    """Get the current user's profile."""
    return UserProfileResponse.model_validate(current_user)


@router.put("", response_model=UserProfileResponse)
def update_profile(
    data: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update the current user's profile."""
    updated = user_service.update_user_profile(db, current_user.id, data)
    return UserProfileResponse.model_validate(updated)


@router.put("/password", response_model=UserProfileResponse)
def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Change user password."""
    updated = user_service.change_user_password(db, current_user.id, data)
    return UserProfileResponse.model_validate(updated)

