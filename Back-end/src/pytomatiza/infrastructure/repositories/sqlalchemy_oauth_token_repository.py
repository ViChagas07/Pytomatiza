"""SQLAlchemyOAuthTokenRepository — persists and retrieves OAuth tokens."""

from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from pytomatiza.domain.entities.oauth_token import OAuthToken
from pytomatiza.infrastructure.db.models.oauth_token_model import (
    GoogleOAuthTokenModel,
)


class SQLAlchemyOAuthTokenRepository:
    """CRUD operations for OAuth tokens stored in PostgreSQL."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def find_by_user_and_service(
        self, user_id: UUID, provider: str, service: str
    ) -> OAuthToken | None:
        result = await self._session.execute(
            select(GoogleOAuthTokenModel).where(
                GoogleOAuthTokenModel.user_id == user_id,
                GoogleOAuthTokenModel.provider == provider,
                GoogleOAuthTokenModel.service == service,
            )
        )
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model is not None else None

    async def upsert(self, token: OAuthToken) -> OAuthToken:
        """Insert or update an OAuth token (upsert by user+provider+service)."""
        existing = await self._session.scalar(
            select(GoogleOAuthTokenModel).where(
                GoogleOAuthTokenModel.user_id == token.user_id,
                GoogleOAuthTokenModel.provider == token.provider,
                GoogleOAuthTokenModel.service == token.service,
            )
        )

        if existing is not None:
            # Update existing
            existing.access_token = token.access_token
            existing.refresh_token = token.refresh_token
            existing.token_type = token.token_type
            existing.scopes = token.scopes
            existing.expires_at = token.expires_at
            existing.updated_at = datetime.now(timezone.utc)
        else:
            # Insert new
            model = self._to_model(token)
            self._session.add(model)

        await self._session.flush()
        return token

    async def delete(self, user_id: UUID, provider: str, service: str) -> bool:
        """Delete the OAuth token. Returns True if a row was deleted."""
        result = await self._session.execute(
            delete(GoogleOAuthTokenModel).where(
                GoogleOAuthTokenModel.user_id == user_id,
                GoogleOAuthTokenModel.provider == provider,
                GoogleOAuthTokenModel.service == service,
            )
        )
        await self._session.flush()
        return result.rowcount > 0  # type: ignore[union-attr]

    # ── Mappers ─────────────────────────────────────────────────────────

    @staticmethod
    def _to_entity(model: GoogleOAuthTokenModel) -> OAuthToken:
        return OAuthToken(
            id=model.id,
            user_id=model.user_id,
            provider=model.provider,
            service=model.service,
            access_token=model.access_token,
            refresh_token=model.refresh_token,
            token_type=model.token_type,
            scopes=model.scopes,
            expires_at=model.expires_at,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )

    @staticmethod
    def _to_model(token: OAuthToken) -> GoogleOAuthTokenModel:
        return GoogleOAuthTokenModel(
            id=token.id if token.id else uuid4(),
            user_id=token.user_id,
            provider=token.provider,
            service=token.service,
            access_token=token.access_token,
            refresh_token=token.refresh_token,
            token_type=token.token_type,
            scopes=token.scopes,
            expires_at=token.expires_at,
        )
