"""SQLAlchemyUserRepository — concrete implementation of UserRepository."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from pytomatiza.domain.entities.user import User
from pytomatiza.domain.value_objects.email import Email
from pytomatiza.infrastructure.db.models.user_model import UserModel


class SQLAlchemyUserRepository:
    """Persist and retrieve User entities via SQLAlchemy + asyncpg.

    Implements the UserRepository Protocol from the domain layer.
    """

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def find_by_id(self, user_id: UUID) -> User | None:
        result = await self._session.execute(
            select(UserModel).where(UserModel.id == user_id)
        )
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model is not None else None

    async def find_by_email(self, email: str) -> User | None:
        result = await self._session.execute(
            select(UserModel).where(UserModel.email == email)
        )
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model is not None else None

    async def save(self, user: User) -> User:
        model = await self._session.get(UserModel, user.id)
        if model is None:
            model = self._to_model(user)
            self._session.add(model)
        else:
            self._update_model(model, user)
        await self._session.flush()
        # Return the original entity to preserve domain events.
        return user

    async def delete(self, user_id: UUID) -> None:
        model = await self._session.get(UserModel, user_id)
        if model is not None:
            await self._session.delete(model)

    # ── Mappers ─────────────────────────────────────────────────────────

    @staticmethod
    def _to_entity(model: UserModel) -> User:
        return User(
            id=model.id,
            email=Email(model.email),
            hashed_password=model.hashed_password,
            name=model.name,
            is_active=model.is_active,
            is_verified=model.is_verified,
            oauth_provider=model.oauth_provider,
            created_at=model.created_at,
        )

    @staticmethod
    def _to_model(user: User) -> UserModel:
        return UserModel(
            id=user.id,
            email=str(user.email),
            hashed_password=user.hashed_password,
            name=user.name,
            is_active=user.is_active,
            is_verified=user.is_verified,
            oauth_provider=user.oauth_provider,
            created_at=user.created_at,
        )

    @staticmethod
    def _update_model(model: UserModel, user: User) -> None:
        model.email = str(user.email)
        model.hashed_password = user.hashed_password
        model.name = user.name
        model.is_active = user.is_active
        model.is_verified = user.is_verified
        model.oauth_provider = user.oauth_provider
