"""JWTTokenService — concrete JWT token generation and validation.
Uses python-jose for HS256-signed JWTs with configurable expiration.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

from jose import jwt
from jose.exceptions import JWTError  # noqa: F401 — re-exported for callers
__all__ = ["JWTTokenService", "JWTError"]

from pytomatiza.application.dtos.auth_dtos import TokenResponse
from pytomatiza.config import settings


class JWTTokenService:
    """Generate and decode JWT access + refresh tokens.

    Implements the TokenService Protocol from the application layer.
    """

    def generate_tokens(self, user_id: str) -> TokenResponse:
        """Generate an access/refresh token pair for the given user."""
        now = datetime.now(timezone.utc)

        access_payload: dict[str, Any] = {
            "sub": user_id,
            "jti": str(uuid.uuid4()),
            "iat": now,
            "exp": now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
            "type": "access",
        }
        refresh_payload: dict[str, Any] = {
            "sub": user_id,
            "jti": str(uuid.uuid4()),
            "iat": now,
            "exp": now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
            "type": "refresh",
        }

        return TokenResponse(
            access_token=jwt.encode(
                access_payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM
            ),
            refresh_token=jwt.encode(
                refresh_payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM
            ),
        )

    def decode_token(self, token: str) -> dict[str, Any]:
        """Decode and validate a JWT token. Raises JWTError on failure."""
        decoded: dict[str, Any] = jwt.decode(
            token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM]
        )
        return decoded