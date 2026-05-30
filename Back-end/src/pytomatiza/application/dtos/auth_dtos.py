"""Auth DTOs — command/query/response models for authentication endpoints."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


# ── Inbound commands ────────────────────────────────────────────────────


class RegisterUserCommand(BaseModel):
    """Payload for registering a new account."""

    name: str = Field(min_length=2, max_length=60)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginCommand(BaseModel):
    """Payload for credentials-based login."""

    email: EmailStr
    password: str


class RefreshTokenCommand(BaseModel):
    """Payload for refreshing an access token."""

    refresh_token: str


class LogoutCommand(BaseModel):
    """Payload for logging out (blacklisting refresh token)."""

    refresh_token: str


class PasswordResetRequestCommand(BaseModel):
    """Payload to initiate password reset via email."""

    email: EmailStr


class PasswordResetConfirmCommand(BaseModel):
    """Payload to confirm password reset with a token."""

    token: str
    new_password: str = Field(min_length=8, max_length=128)


# ── Outbound responses ──────────────────────────────────────────────────


class TokenResponse(BaseModel):
    """JWT token pair returned after authentication."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    """Public user profile data returned to clients."""

    id: UUID
    name: str
    email: str
    is_verified: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class MessageResponse(BaseModel):
    """Generic message response for non-data endpoints."""

    message: str
