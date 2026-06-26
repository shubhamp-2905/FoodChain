"""
FoodChain AI - User Schemas

Pydantic v2 schemas for user profile.
"""

from datetime import datetime
from pydantic import BaseModel, Field


class UserProfileResponse(BaseModel):
    """Schema for user profile response."""

    id: int
    full_name: str
    email: str
    mobile_number: str
    business_name: str
    food_type: str
    latitude: float | None = None
    longitude: float | None = None
    area: str | None = None
    city: str | None = None
    state: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UpdateProfileRequest(BaseModel):
    """Schema for updating user profile."""

    full_name: str | None = Field(None, min_length=2, max_length=100)
    mobile_number: str | None = Field(None, min_length=10, max_length=15)
    business_name: str | None = Field(None, min_length=2, max_length=150)
    food_type: str | None = Field(None, min_length=2, max_length=50)
    latitude: float | None = Field(None, ge=-90, le=90)
    longitude: float | None = Field(None, ge=-180, le=180)
    area: str | None = Field(None, min_length=2, max_length=100)
    city: str | None = Field(None, min_length=2, max_length=100)
    state: str | None = Field(None, min_length=2, max_length=100)


class ChangePasswordRequest(BaseModel):
    """Schema for changing user password."""

    current_password: str
    new_password: str = Field(..., min_length=6, max_length=50)

