"""Jira Integration Provider — OAuth 3LO (Atlassian), issues, tasks, updates.

Each user connects their own Atlassian site via OAuth 2.0 (3LO). The token
is stored encrypted in ``integration_tokens``. The ``cloud_id`` is extracted
from the Atlassian accessible-resources API at OAuth callback time and stored
in ``external_account_id`` for constructing API URLs.

REFRESH TOKEN SUPPORT
---------------------
Jira/Atlassian OAuth tokens expire after a fixed period (typically 1 hour).
This provider automatically detects expired tokens (via ``expires_at`` or
HTTP 401) and calls ``POST https://auth.atlassian.com/oauth/token`` with
``grant_type=refresh_token`` to obtain fresh credentials. The updated token
is persisted atomically in the database via ``IntegrationTokenRepository.upsert()``.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone, timedelta
from typing import Any
from uuid import UUID

import httpx

from pytomatiza.config import settings
from pytomatiza.domain.entities.integration_token import (
    IntegrationToken,
    IntegrationTokenStatus,
)
from pytomatiza.domain.services.integrations.provider import (
    IntegrationAction,
    IntegrationHealth,
    IntegrationProvider,
)
from pytomatiza.infrastructure.db.session import AsyncSessionLocal
from pytomatiza.infrastructure.repositories.integration_token_repository import (
    IntegrationTokenRepository,
)

logger = logging.getLogger(__name__)

_JIRA_API_BASE = "https://api.atlassian.com/ex/jira"
_ATLASSIAN_TOKEN_URL = "https://auth.atlassian.com/oauth/token"


class JiraProvider(IntegrationProvider):
    """OAuth 2.0 (3LO) provider for Atlassian Jira Cloud.

    Usage::

        provider = JiraProvider()
        health = await provider.health_check(user_id=user.id)
        result = await provider.execute_action("create_issue", {...}, user_id=user.id)
    """

    service_name = "jira"

    # ── Token retrieval ────────────────────────────────────────────────

    async def _get_token(self, user_id: UUID | None = None) -> IntegrationToken | None:
        """Load the Jira OAuth token for a user from the database."""
        if user_id is None:
            return None
        async with AsyncSessionLocal() as session:
            repo = IntegrationTokenRepository(session)
            return await repo.find_by_user_and_service(
                user_id=user_id,
                provider="jira",
                service="jira",
            )

    def _get_cloud_id(self, token: IntegrationToken) -> str:
        """Extract the cloud_id from the token.

        Priority:
        1. ``external_account_id`` (set by OAuth callback via accessible-resources)
        2. ``extra_data["cloud_id"]`` (legacy fallback)
        """
        if token.external_account_id:
            return token.external_account_id
        return token.extra_data.get("cloud_id", "")

    def _get_base_url(self, token: IntegrationToken) -> str:
        """Build the Jira REST API base URL for this user's site."""
        cloud_id = self._get_cloud_id(token)
        if not cloud_id:
            return ""
        return f"{_JIRA_API_BASE}/{cloud_id}/rest/api/3"

    # ── Token auto-refresh ─────────────────────────────────────────────

    async def refresh_token(self, token: IntegrationToken) -> IntegrationToken | None:
        """Exchange a refresh token for a new access token.

        Calls ``POST https://auth.atlassian.com/oauth/token`` with
        ``grant_type=refresh_token``. Persists the updated token in the
        database and returns a fresh ``IntegrationToken``.

        Returns ``None`` if the refresh fails (user must re-authenticate).
        """
        if not token.refresh_token:
            logger.warning("Jira token for user %s has no refresh_token", token.user_id)
            return None

        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.post(
                    _ATLASSIAN_TOKEN_URL,
                    data={
                        "grant_type": "refresh_token",
                        "client_id": settings.JIRA_CLIENT_ID,
                        "client_secret": settings.JIRA_CLIENT_SECRET,
                        "refresh_token": token.refresh_token,
                    },
                    headers={"Content-Type": "application/x-www-form-urlencoded"},
                )
        except httpx.RequestError as exc:
            logger.error("Jira refresh token request failed: %s", exc)
            return None

        if resp.status_code != 200:
            logger.warning(
                "Jira refresh token failed: HTTP %d — %s",
                resp.status_code, resp.text[:200],
            )
            return None

        body: dict[str, Any] = resp.json()
        new_access = body.get("access_token", "")
        new_refresh = body.get("refresh_token", token.refresh_token)
        expires_in = body.get("expires_in", 3600)

        if not new_access:
            logger.error("Jira refresh response missing access_token")
            return None

        # Build updated domain token  (same id/user_id/provider/service)
        updated = IntegrationToken(
            id=token.id,
            user_id=token.user_id,
            provider=token.provider,
            service=token.service,
            access_token=new_access,
            refresh_token=new_refresh,
            token_type=body.get("token_type", token.token_type),
            scopes=body.get("scope", token.scopes),
            expires_at=datetime.now(timezone.utc) + timedelta(seconds=expires_in),
            external_account_id=token.external_account_id,
            external_account_name=token.external_account_name,
            extra_data=token.extra_data,
            status=IntegrationTokenStatus.ACTIVE,
            created_at=token.created_at,
            updated_at=datetime.now(timezone.utc),
        )

        # Persist the updated token
        try:
            async with AsyncSessionLocal() as session:
                repo = IntegrationTokenRepository(session)
                await repo.upsert(updated)
        except Exception as exc:
            logger.error("Failed to persist refreshed Jira token: %s", exc)
            return None

        logger.info(
            "Jira token refreshed for user %s (expires at %s)",
            token.user_id, updated.expires_at,
        )
        return updated

    async def _ensure_valid_token(self, token: IntegrationToken) -> IntegrationToken:
        """Check if the token is expired and refresh if needed.

        Returns the (potentially refreshed) token.  If refresh fails the
        original token is returned — the caller will likely get a 401 and
        surface an appropriate error.
        """
        now = datetime.now(timezone.utc)

        # If there is no expires_at, we cannot determine expiry — use as-is.
        if token.expires_at is None:
            return token

        # Safety margin: refresh 5 minutes before actual expiry.
        if token.expires_at > now + timedelta(minutes=5):
            return token  # still plenty of life

        if not token.refresh_token:
            logger.warning(
                "Jira token for user %s is expired and has no refresh_token",
                token.user_id,
            )
            return token

        refreshed = await self.refresh_token(token)
        return refreshed or token

    # ── Health check ───────────────────────────────────────────────────

    async def health_check(self, user_id: UUID | None = None) -> IntegrationHealth:
        token = await self._get_token(user_id)
        if token is None:
            return IntegrationHealth(
                service=self.service_name, connected=False,
                status="disconnected",
                message="Jira não conectado — autorize seu site Atlassian",
            )

        # Auto-refresh if needed
        token = await self._ensure_valid_token(token)

        base_url = self._get_base_url(token)
        if not base_url:
            return IntegrationHealth(
                service=self.service_name, connected=False,
                status="error",
                message="cloud_id não encontrado — reconecte sua conta Jira",
            )

        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(
                    f"{base_url}/myself",
                    headers={"Authorization": f"Bearer {token.access_token}"},
                )

                if resp.status_code == 200:
                    data = resp.json()
                    display_name = data.get("displayName", token.external_account_name)
                    return IntegrationHealth(
                        service=self.service_name, connected=True,
                        status="connected",
                        message=f"Autenticado como {display_name}",
                        details={
                            "display_name": display_name,
                            "account_id": token.external_account_id,
                        },
                    )

                # 401 → token might have expired → try one refresh cycle
                if resp.status_code == 401 and token.refresh_token:
                    logger.info(
                        "Jira health_check got 401 — attempting token refresh "
                        "for user %s", user_id,
                    )
                    refreshed = await self.refresh_token(token)
                    if refreshed is not None:
                        # Retry with the fresh token
                        return await self.health_check(user_id=user_id)

                return IntegrationHealth(
                    service=self.service_name, connected=False,
                    status="error",
                    message=f"Jira API error ({resp.status_code})",
                )

        except Exception as exc:
            return IntegrationHealth(
                service=self.service_name, connected=False,
                status="error", message=str(exc),
            )

    # ── Action execution ──────────────────────────────────────────────

    async def execute_action(
        self, action: str, params: dict[str, Any],
        user_id: UUID | None = None,
    ) -> IntegrationAction:
        try:
            token = await self._get_token(user_id)
            if token is None:
                return IntegrationAction(
                    success=False, action=action,
                    error="Jira não conectado. Conecte seu site Atlassian primeiro.",
                )

            # Auto-refresh if needed
            token = await self._ensure_valid_token(token)

            base_url = self._get_base_url(token)
            if not base_url:
                return IntegrationAction(
                    success=False, action=action,
                    error="cloud_id não encontrado — reconecte sua conta Jira",
                )

            headers = {
                "Authorization": f"Bearer {token.access_token}",
                "Content-Type": "application/json",
                "Accept": "application/json",
            }

            if action in ("create_issue", "create_bug", "create_task"):
                result = await self._create_issue(action, params, base_url, headers, token)
                if result is not None:
                    return result
                # If result is None → should have been handled in _create_issue
                return IntegrationAction(
                    success=False, action=action,
                    error="Erro desconhecido ao criar issue",
                )

            if action == "update_issue":
                result = await self._update_issue(params, base_url, headers, token)
                if result is not None:
                    return result
                return IntegrationAction(
                    success=False, action=action,
                    error="Erro desconhecido ao atualizar issue",
                )

            return IntegrationAction(
                success=False, action=action,
                error=f"Ação desconhecida: {action}",
            )

        except Exception as exc:
            return IntegrationAction(
                success=False, action=action, error=str(exc),
            )

    # ── Internal action implementations with retry-on-401 ──────────────

    async def _create_issue(
        self, action: str, params: dict[str, Any],
        base_url: str, headers: dict[str, str],
        token: IntegrationToken,
    ) -> IntegrationAction | None:
        project_key = params.get("project_key", params.get("project", ""))
        summary = params.get("summary", params.get("title", "New Issue"))
        description = params.get("description", params.get("desc", ""))
        issue_type_map = {
            "create_bug": "Bug",
            "create_task": "Task",
            "create_issue": "Task",
        }
        issue_type = issue_type_map.get(action, "Task")

        payload = {
            "fields": {
                "project": {"key": project_key},
                "summary": summary,
                "description": {
                    "type": "doc", "version": 1,
                    "content": [
                        {
                            "type": "paragraph",
                            "content": [{"type": "text", "text": description}],
                        }
                    ],
                },
                "issuetype": {"name": issue_type},
            }
        }

        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                f"{base_url}/issue", json=payload, headers=headers,
            )

            # 401 → token expired → refresh and retry once
            if resp.status_code == 401 and token.refresh_token:
                refreshed = await self.refresh_token(token)
                if refreshed is not None:
                    headers["Authorization"] = f"Bearer {refreshed.access_token}"
                    resp = await client.post(
                        f"{base_url}/issue", json=payload, headers=headers,
                    )

            if resp.status_code == 201:
                data = resp.json()
                return IntegrationAction(
                    success=True, action=action,
                    result={"key": data.get("key"), "id": data.get("id")},
                )

            return IntegrationAction(
                success=False, action=action,
                error=f"HTTP {resp.status_code}: {resp.text[:200]}",
            )

    async def _update_issue(
        self, params: dict[str, Any],
        base_url: str, headers: dict[str, str],
        token: IntegrationToken,
    ) -> IntegrationAction | None:
        issue_key = params.get("issue_key", params.get("key", ""))
        updates = params.get("updates", {})

        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.put(
                f"{base_url}/issue/{issue_key}",
                json={"fields": updates},
                headers=headers,
            )

            # 401 → token expired → refresh and retry once
            if resp.status_code == 401 and token.refresh_token:
                refreshed = await self.refresh_token(token)
                if refreshed is not None:
                    headers["Authorization"] = f"Bearer {refreshed.access_token}"
                    resp = await client.put(
                        f"{base_url}/issue/{issue_key}",
                        json={"fields": updates},
                        headers=headers,
                    )

            return IntegrationAction(
                success=resp.status_code in (200, 204),
                action="update_issue",
                result={"status": resp.status_code},
            )

    async def validate_credentials(self) -> bool:
        return False  # requires user_id
