"""IntegrationTokenRepository — persists IntegrationToken entities with
automatic encryption/decryption of sensitive fields.

All tokens are encrypted at rest using AES-256-GCM. The repository layer
transparently encrypts on save and decrypts on read so that callers
never deal with raw ciphertext.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from pytomatiza.domain.entities.integration_token import (
    IntegrationToken,
    IntegrationTokenStatus,
)
from pytomatiza.infrastructure.db.models.integration_token_model import (
    IntegrationTokenModel,
)
from pytomatiza.infrastructure.security.token_encryption import (
    TokenEncryptionService,
)


class IntegrationTokenRepository:
    """CRUD for integration tokens with automatic field-level encryption."""

    def __init__(
        self,
        session: AsyncSession,
        encryption: TokenEncryptionService | None = None,
    ) -> None:
        self._session = session
        self._crypto = encryption or TokenEncryptionService()

    # ── Queries ────────────────────────────────────────────────────────

    async def find_by_user_and_service(
        self,
        user_id: UUID,
        provider: str,
        service: str,
    ) -> IntegrationToken | None:
        """Look up a single token by (user_id, provider, service)."""
        result = await self._session.execute(
            select(IntegrationTokenModel).where(
                IntegrationTokenModel.user_id == user_id,
                IntegrationTokenModel.provider == provider,
                IntegrationTokenModel.service == service,
            )
        )
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def list_by_user(
        self,
        user_id: UUID,
        provider: str | None = None,
    ) -> list[IntegrationToken]:
        """List all tokens for a user, optionally filtered by provider."""
        stmt = select(IntegrationTokenModel).where(
            IntegrationTokenModel.user_id == user_id
        )
        if provider:
            stmt = stmt.where(IntegrationTokenModel.provider == provider)
        result = await self._session.execute(stmt)
        return [self._to_entity(m) for m in result.scalars().all()]

    async def list_by_provider(
        self,
        provider: str,
    ) -> list[IntegrationToken]:
        """List all tokens for a given provider (e.g. all Slack connections)."""
        result = await self._session.execute(
            select(IntegrationTokenModel).where(
                IntegrationTokenModel.provider == provider,
                IntegrationTokenModel.status == "active",
            )
        )
        return [self._to_entity(m) for m in result.scalars().all()]

    async def find_by_external_account(
        self,
        provider: str,
        external_account_id: str,
    ) -> IntegrationToken | None:
        """Find a token by provider + external account (e.g. Discord guild_id)."""
        result = await self._session.execute(
            select(IntegrationTokenModel).where(
                IntegrationTokenModel.provider == provider,
                IntegrationTokenModel.external_account_id == external_account_id,
            )
        )
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    # ── Mutations ──────────────────────────────────────────────────────

    async def upsert(self, token: IntegrationToken) -> IntegrationToken:
        """Insert or update a token (upsert by user_id + provider + service).

        Automatically encrypts ``access_token`` and ``refresh_token``
        before persisting.
        """
        existing = await self._session.scalar(
            select(IntegrationTokenModel).where(
                IntegrationTokenModel.user_id == token.user_id,
                IntegrationTokenModel.provider == token.provider,
                IntegrationTokenModel.service == token.service,
            )
        )

        if existing is not None:
            existing.access_token = self._crypto.encrypt(token.access_token)
            existing.refresh_token = (
                self._crypto.encrypt(token.refresh_token)
                if token.refresh_token
                else None
            )
            existing.token_type = token.token_type
            existing.scopes = token.scopes
            existing.expires_at = token.expires_at
            existing.external_account_id = token.external_account_id
            existing.external_account_name = token.external_account_name
            existing.extra_data = token.extra_data
            existing.status = token.status.value
            existing.updated_at = datetime.now(timezone.utc)
        else:
            model = self._to_model(token, self._crypto)
            self._session.add(model)

        await self._session.flush()
        return token

    async def delete(
        self,
        user_id: UUID,
        provider: str,
        service: str,
    ) -> bool:
        """Remove a token. Returns True if a row was deleted."""
        result = await self._session.execute(
            delete(IntegrationTokenModel).where(
                IntegrationTokenModel.user_id == user_id,
                IntegrationTokenModel.provider == provider,
                IntegrationTokenModel.service == service,
            )
        )
        await self._session.flush()
        return result.rowcount > 0  # type: ignore[union-attr]

    async def update_status(
        self,
        user_id: UUID,
        provider: str,
        service: str,
        status: IntegrationTokenStatus,
    ) -> bool:
        """Update only the status field (e.g. after revoke)."""
        existing = await self._session.scalar(
            select(IntegrationTokenModel).where(
                IntegrationTokenModel.user_id == user_id,
                IntegrationTokenModel.provider == provider,
                IntegrationTokenModel.service == service,
            )
        )
        if existing is None:
            return False
        existing.status = status.value
        existing.updated_at = datetime.now(timezone.utc)
        await self._session.flush()
        return True

    # ── Mappers ────────────────────────────────────────────────────────

    def _to_entity(self, model: IntegrationTokenModel) -> IntegrationToken:
        """Decrypt tokens when reading from DB."""
        return IntegrationToken(
            id=model.id,
            user_id=model.user_id,
            tenant_id=model.tenant_id,
            provider=model.provider,
            service=model.service,
            access_token=self._crypto.decrypt(model.access_token),
            refresh_token=(
                self._crypto.decrypt(model.refresh_token)
                if model.refresh_token
                else None
            ),
            token_type=model.token_type,
            scopes=model.scopes,
            expires_at=model.expires_at,
            external_account_id=model.external_account_id,
            external_account_name=model.external_account_name,
            extra_data=model.extra_data,
            status=IntegrationTokenStatus(model.status),
            created_at=model.created_at,
            updated_at=model.updated_at,
        )

    @staticmethod
    def _to_model(
        token: IntegrationToken,
        crypto: TokenEncryptionService,
    ) -> IntegrationTokenModel:
        """Encrypt tokens before persisting."""
        return IntegrationTokenModel(
            id=token.id or uuid4(),
            user_id=token.user_id,
            tenant_id=token.tenant_id,
            provider=token.provider,
            service=token.service,
            access_token=crypto.encrypt(token.access_token),
            refresh_token=(
                crypto.encrypt(token.refresh_token)
                if token.refresh_token
                else None
            ),
            token_type=token.token_type,
            scopes=token.scopes,
            expires_at=token.expires_at,
            external_account_id=token.external_account_id,
            external_account_name=token.external_account_name,
            extra_data=token.extra_data,
            status=token.status.value,
        )
