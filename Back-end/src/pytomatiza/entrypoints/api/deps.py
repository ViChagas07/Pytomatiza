"""FastAPI dependency injection — provides DB sessions, current user, and services.

All dependencies are wired here. Routers never instantiate repositories or
services directly — they receive them via `Depends()`.
"""
from __future__ import annotations

import uuid
from collections.abc import AsyncGenerator
from typing import Annotated

import redis.asyncio as aioredis
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from pytomatiza.domain.entities.user import User
from pytomatiza.infrastructure.cache.redis_client import get_redis
from pytomatiza.infrastructure.db.session import AsyncSessionLocal
from pytomatiza.infrastructure.repositories.sqlalchemy_user_repository import (
    SQLAlchemyUserRepository,
)
from pytomatiza.infrastructure.security.jwt_token_service import JWTTokenService

bearer_scheme = HTTPBearer(auto_error=False)


# ── Database Session ────────────────────────────────────────────────────


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Yield an async database session with automatic transaction management.

    The session is committed on success and rolled back on exception.
    """
    async with AsyncSessionLocal() as session:
        async with session.begin():
            yield session


# ── Current User ────────────────────────────────────────────────────────


async def get_current_user(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None,
        Depends(bearer_scheme),
    ],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    """Extract and validate the JWT token, returning the authenticated User entity."""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token_service = JWTTokenService()

    # Decode and validate token claims
    # NOTE: HTTPException is intentionally NOT caught here — it must propagate.
    try:
        payload: dict[str, object] = token_service.decode_token(credentials.credentials)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    raw_sub = payload.get("sub")
    if not isinstance(raw_sub, str):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed token payload.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user_id = uuid.UUID(raw_sub)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token subject.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    repo = SQLAlchemyUserRepository(db)
    user = await repo.find_by_id(user_id)

    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


async def get_optional_current_user(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None,
        Depends(bearer_scheme),
    ],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User | None:
    """Like get_current_user, but returns None for unauthenticated requests."""
    if credentials is None:
        return None
    try:
        return await get_current_user(credentials, db)
    except HTTPException:
        return None


# ── Redis ───────────────────────────────────────────────────────────────


async def get_redis_client() -> aioredis.Redis[str]:
    """Return the shared Redis client (decode_responses=True, so key type is str)."""
    return await get_redis()