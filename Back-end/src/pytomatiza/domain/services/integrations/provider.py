"""Integration Provider — abstract base for all third-party integrations.

Each provider must implement:
  - authenticate()    — obtain a new token / validate existing credentials
  - refresh_token()   — refresh an expired token (if the provider supports it)
  - execute_action()  — perform an action using the user's token
  - revoke()          — revoke a token server-side
  - health_check()    — check if the integration is working for a user
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any
from uuid import UUID

from pytomatiza.domain.entities.integration_token import IntegrationToken


@dataclass(frozen=True)
class IntegrationHealth:
    """Health status of a third-party integration."""
    service: str
    connected: bool
    status: str  # "connected" | "disconnected" | "error"
    message: str = ""
    details: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class IntegrationAction:
    """Result of an integration action execution."""
    success: bool
    action: str
    result: dict[str, Any] = field(default_factory=dict)
    error: str | None = None


class IntegrationProvider(ABC):
    """Abstract base for all third-party service integrations.

    Subclasses must define ``service_name`` and implement all abstract
    methods. The ``_get_token()`` helper is encouraged but not required
    by the interface.
    """

    @property
    @abstractmethod
    def service_name(self) -> str:
        """Unique identifier for this service (e.g. 'slack', 'google_drive')."""
        ...

    async def authenticate(self, user_id: UUID, **kwargs: Any) -> IntegrationToken:
        """Obtain or validate a token for the given user.

        For OAuth providers this is handled by the ``OAuthFlowService``.
        For API-key providers (Telegram, Trello) this validates a user-supplied
        token and persists it.

        Default raises ``NotImplementedError`` — override per provider.
        """
        raise NotImplementedError(
            f"{self.__class__.__name__} does not implement authenticate(). "
            f"Use OAuthFlowService for OAuth providers."
        )

    async def refresh_token(
        self, token: IntegrationToken,
    ) -> IntegrationToken | None:
        """Refresh an expired token.

        Returns an updated ``IntegrationToken`` with a new access_token
        and possibly a new refresh_token, or ``None`` if the token cannot
        be refreshed (user must re-authenticate).

        Default returns ``None`` — override for providers that support refresh.
        """
        return None

    @abstractmethod
    async def execute_action(
        self,
        action: str,
        params: dict[str, Any],
        user_id: UUID | None = None,
    ) -> IntegrationAction:
        """Execute an action on the third-party service.

        The provider MUST look up the correct token for ``user_id`` —
        never use global credentials.
        """
        ...

    async def revoke(self, user_id: UUID) -> bool:
        """Revoke the user's token server-side (if supported).

        Returns ``True`` if revoked successfully, ``False`` if the provider
        does not support server-side revocation.
        Default returns ``False``.
        """
        return False

    @abstractmethod
    async def health_check(
        self, user_id: UUID | None = None,
    ) -> IntegrationHealth:
        """Check whether the integration is operable for the given user."""
        ...

    async def validate_credentials(self) -> bool:
        """Check if the provider has valid global credentials (if any).

        Default implementation returns ``False`` to indicate that
        per-user validation via ``health_check(user_id)`` is required.
        """
        return False
