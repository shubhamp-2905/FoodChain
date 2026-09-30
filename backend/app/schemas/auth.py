"""
FoodChain AI - Auth Schemas

Pydantic v2 schemas for authentication requests/responses.
"""

from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    """Schema for user registration."""

    full_name: str = Field(..., min_length=2, max_length=100, examples=["Rahul Sharma"])
    email: EmailStr = Field(..., examples=["rahul@example.com"])
    password: str = Field(..., min_length=6, max_length=128, examples=["securepass123"])
    mobile_number: str = Field(..., min_length=10, max_length=15, examples=["9876543210"])
    business_name: str = Field(..., min_length=2, max_length=150, examples=["Rahul's Vada Pav"])
    food_type: str = Field(..., min_length=2, max_length=50, examples=["Vada Pav"])
    latitude: float | None = Field(None, ge=-90, le=90, examples=[18.5204])
    longitude: float | None = Field(None, ge=-180, le=180, examples=[73.8567])
    area: str | None = Field(None, min_length=2, max_length=100, examples=["Kharadi"])
    city: str | None = Field(None, min_length=2, max_length=100, examples=["Pune"])
    state: str | None = Field(None, min_length=2, max_length=100, examples=["Maharashtra"])
    role: str = Field(default="vendor", examples=["vendor"])


class LoginRequest(BaseModel):
    """Schema for user login."""

    email: EmailStr = Field(..., examples=["rahul@example.com"])
    password: str = Field(..., min_length=1, examples=["securepass123"])


class TokenResponse(BaseModel):
    """Schema for JWT token response."""

    access_token: str
    token_type: str = "bearer"


class AuthResponse(BaseModel):
    """Schema for auth response with token and user profile."""

    access_token: str
    token_type: str = "bearer"
    user: "UserProfileResponse"


# Forward reference resolved below
from app.schemas.user import UserProfileResponse  # noqa: E402

AuthResponse.model_rebuild()
