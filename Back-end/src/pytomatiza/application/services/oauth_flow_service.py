"""OAuthFlowService — generic OAuth 2.0 authorization code flow.

Handles the entire OAuth dance for any provider:

1. ``build_authorize_url()`` — generates CSRF state, builds authorize URL
2. ``exchange_code()`` — exchanges authorization code for tokens
3. ``fetch_account_info()`` — retrieves connected account details
4. ``revoke_token()`` — revokes tokens server-side

All providers (Slack, Discord, Jira, Zoom, Google) share this service.
They only need to provide their ``OAuthProviderConfig``.
"""

from __future__ import annotations

import json
import logging
import secrets
from typing import Any
from urllib.parse import urlencode

import httpx

from pytomatiza.application.services.integrations import get_integration_service
from pytomatiza.config import settings
from pytomatiza.domain.entities.integration_token import (
    IntegrationToken,
    IntegrationTokenStatus,
)
from pytomatiza.domain.services.integrations.oauth_config import (
    OAuthProviderConfig,
    OAuthTokenResponse,
)
from pytomatiza.infrastructure.repositories.integration_token_repository import (
    IntegrationTokenRepository,
)
from pytomatiza.infrastructure.security.token_encryption import (
    TokenEncryptionService,
)

logger = logging.getLogger(__name__)


class OAuthFlowService:
    """Generic OAuth 2.0 Authorization Code flow manager.

    Usage::

        config = OAuthProviderConfig(provider="slack", service="workspace", ...)
        flow = OAuthFlowService(config, redis_client)
        url = await flow.build_authorize_url(user_id)
        # redirect user to url ...
        # on callback:
        token = await flow.exchange_code(code, user_id, state)
        await flow.save_token(token, user_id, repo)
    """

    def __init__(
        self,
        config: OAuthProviderConfig,
        redis: Any,  # aioredis.Redis
    ) -> None:
        self._config = config
        self._redis = redis
        self._http = httpx.AsyncClient(timeout=15)
        self._crypto = TokenEncryptionService()

    # ── Step 1: Build Authorization URL ───────────────────────────────

    async def build_authorize_url(
        self,
        user_id: str,
        redirect_uri: str | None = None,
    ) -> str:
        """Generate a CSRF-protected OAuth authorization URL.

        Stores the ``state`` in Redis (TTL 10 min) for callback validation.
        """
        state = secrets.token_urlsafe(32)
        await self._redis.setex(
            f"oauth:state:{state}",
            600,  # 10 minutes
            user_id,
        )

        actual_redirect = redirect_uri or self._default_redirect_uri()

        params: dict[str, str] = {
            "client_id": self._config.client_id,
            "redirect_uri": actual_redirect,
            "response_type": "code",
            "scope": self._config.scopes,
            "state": state,
        }
        params.update(self._config.extra_authorize_params)

        return f"{self._config.authorize_url}?{urlencode(params, doseq=True)}"

    # ── Step 2: Exchange code for tokens ──────────────────────────────

    async def exchange_code(
        self,
        code: str,
        state: str,
        user_id: str,
        redirect_uri: str | None = None,
    ) -> OAuthTokenResponse:
        """Validate ``state``, then exchange ``code`` for an access token.

        Raises ``ValueError`` on CSRF mismatch or token exchange failure.
        """
        # Validate state
        stored_user_id = await self._redis.get(f"oauth:state:{state}")
        if stored_user_id is None or stored_user_id != user_id:
            raise ValueError("Invalid or expired OAuth state (CSRF check failed).")

        # Delete state so it cannot be replayed
        await self._redis.delete(f"oauth:state:{state}")

        actual_redirect = redirect_uri or self._default_redirect_uri()

        # Exchange code for token
        token_data: dict[str, str] = {
            "code": code,
            "client_id": self._config.client_id,
            "client_secret": self._config.client_secret,
            "redirect_uri": actual_redirect,
            "grant_type": "authorization_code",
        }
        token_data.update(self._config.extra_token_params)

        try:
            resp = await self._http.post(
                self._config.token_url,
                data=token_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
        except httpx.RequestError as exc:
            raise ValueError(f"Token exchange request failed: {exc}") from exc

        if resp.status_code != 200:
            error_body = resp.text[:500]
            logger.error(
                "OAuth token exchange failed for %s/%s: HTTP %d - %s",
                self._config.provider,
                self._config.service,
                resp.status_code,
                error_body,
            )
            raise ValueError(
                f"Token exchange failed: HTTP {resp.status_code}"
            )

        body: dict[str, Any] = resp.json()

        return OAuthTokenResponse(
            access_token=body.get(self._config.access_token_key, ""),
            refresh_token=body.get(self._config.refresh_token_key),
            expires_in=int(body.get(self._config.expires_in_key, 3600)),
            scope=body.get(self._config.scope_key, self._config.scopes),
            token_type=body.get(self._config.token_type_key, "Bearer"),
            raw=body,
        )

    # ── Step 3: Fetch connected account info ──────────────────────────

    async def fetch_account_info(
        self,
        access_token: str,
    ) -> dict[str, Any]:
        """Retrieve connected account details from the provider's userinfo endpoint.

        Returns an empty dict if no ``userinfo_url`` is configured or the
        request fails.
        """
        if not self._config.userinfo_url:
            return {}

        try:
            resp = await self._http.get(
                self._config.userinfo_url,
                headers={"Authorization": f"Bearer {access_token}"},
            )
            if resp.status_code != 200:
                logger.warning(
                    "Failed to fetch userinfo from %s: HTTP %d",
                    self._config.userinfo_url,
                    resp.status_code,
                )
                return {}
            return resp.json()
        except Exception as exc:
            logger.warning("Failed to fetch account info: %s", exc)
            return {}

    def extract_account_id(
        self,
        userinfo: dict[str, Any],
    ) -> str:
        """Extract the external account ID from userinfo using the configured path."""
        return self._follow_json_path(userinfo, self._config.userinfo_id_path)

    def extract_account_name(
        self,
        userinfo: dict[str, Any],
    ) -> str:
        """Extract the human-readable account name from userinfo."""
        return self._follow_json_path(userinfo, self._config.userinfo_name_path)

    # ── Step 4: Persist tokens ────────────────────────────────────────

    async def save_token(
        self,
        token_response: OAuthTokenResponse,
        user_id: str,
        repo: IntegrationTokenRepository,
        external_account_id: str = "",
        external_account_name: str = "",
        extra_metadata: dict[str, Any] | None = None,
    ) -> IntegrationToken:
        """Create or update an IntegrationToken from the OAuth response."""
        from uuid import uuid4
        from datetime import datetime, timezone, timedelta

        domain_token = IntegrationToken(
            id=uuid4(),
            user_id=uuid4(),  # will be overridden
            provider=self._config.provider,
            service=self._config.service,
            access_token=token_response.access_token,
            refresh_token=token_response.refresh_token,
            token_type=token_response.token_type,
            scopes=token_response.scope,
            expires_at=(
                datetime.now(timezone.utc) + timedelta(seconds=token_response.expires_in)
                if token_response.expires_in
                else None
            ),
            external_account_id=external_account_id,
            external_account_name=external_account_name,
            extra_data={
                **(extra_metadata or {}),
                "_raw_response": self._sanitize_raw(token_response.raw),
            },
            status=IntegrationTokenStatus.ACTIVE,
        )

        # Use the provided user_id (the domain token has a placeholder)
        domain_token.user_id = uuid4()  # placeholder, will be replaced on upsert
        # Actually, let's just set it correctly:
        domain_token.id = uuid4()
        domain_token.user_id = user_id  # type: ignore[assignment]

        await repo.upsert(domain_token)
        logger.info(
            "Saved %s/%s token for user %s (account: %s)",
            self._config.provider,
            self._config.service,
            user_id,
            external_account_name or "unknown",
        )
        return domain_token

    # ── Revocation ────────────────────────────────────────────────────

    async def revoke(self, access_token: str) -> bool:
        """Revoke an OAuth token server-side if the provider supports it."""
        if not self._config.revoke_url:
            return False
        try:
            resp = await self._http.post(
                self._config.revoke_url,
                params={"token": access_token},
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            return resp.status_code == 200
        except Exception as exc:
            logger.warning("Token revocation failed: %s", exc)
            return False

    # ── Internals ─────────────────────────────────────────────────────

    def _default_redirect_uri(self) -> str:
        """Build the default callback URL for this provider."""
        # POST /api/v1/auth/{provider}/callback
        # But the frontend URL proxy rewrites it:
        return f"{settings.FRONTEND_URL}/api/v1/auth/{self._config.provider}/callback"

    @staticmethod
    def _follow_json_path(
        data: Any,
        path: list[str],
    ) -> str:
        """Traverse a nested dict/list following ``path``, return value or ``""``.

        Supports both dict keys and list indices (e.g. ``["0", "id"]`` for
        Jira's accessible-resources array response).
        """
        current: Any = data
        for key in path:
            if isinstance(current, dict):
                current = current.get(key)
            elif isinstance(current, (list, tuple)):
                try:
                    current = current[int(key)]
                except (IndexError, ValueError, TypeError):
                    return ""
            else:
                return ""
            if current is None:
                return ""
        return str(current) if current is not None else ""

    @staticmethod
    def _sanitize_raw(raw: dict[str, Any]) -> dict[str, Any]:
        """Remove sensitive fields from raw token response before saving as metadata."""
        sensitive = {"access_token", "refresh_token", "client_secret"}
        return {k: v for k, v in raw.items() if k not in sensitive}
