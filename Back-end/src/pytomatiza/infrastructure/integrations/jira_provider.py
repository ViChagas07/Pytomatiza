"""Jira Integration Provider — OAuth 3LO (Atlassian), issues, tasks, updates.

Each user connects their own Atlassian site via OAuth. The token is stored
encrypted in ``integration_tokens``. The ``cloud_id`` is extracted from the
Atlassian API and stored in ``extra_data`` for constructing API URLs.

Replaces the previous Basic Auth (email + API token) which used global
credentials from .env.
"""

from __future__ import annotations

import logging
from typing import Any
from uuid import UUID

import httpx

from pytomatiza.domain.entities.integration_token import IntegrationToken
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


class JiraProvider(IntegrationProvider):
    service_name = "jira"

    async def _get_token(self, user_id: UUID | None = None) -> IntegrationToken | None:
        """Load the Jira OAuth token for a user from the database."""
        if user_id is None:
            return None
        async with AsyncSessionLocal() as session:
            repo = IntegrationTokenRepository(session)
            return await repo.find_by_user_and_service(
                user_id=user_id,
                provider="jira",
                service="site",
            )

    def _get_cloud_id(self, token: IntegrationToken) -> str:
        """Extract the cloud_id from the token's extra_data."""
        return token.extra_data.get("cloud_id", "")

    def _get_base_url(self, token: IntegrationToken) -> str:
        """Build the Jira REST API base URL for this user's site."""
        cloud_id = self._get_cloud_id(token)
        if not cloud_id:
            return ""
        return f"{_JIRA_API_BASE}/{cloud_id}/rest/api/3"

    async def health_check(self, user_id: UUID | None = None) -> IntegrationHealth:
        token = await self._get_token(user_id)
        if token is None:
            return IntegrationHealth(
                service=self.service_name, connected=False,
                status="disconnected",
                message="Jira não conectado — autorize seu site Atlassian",
            )
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
                project_key = params.get("project_key", params.get("project", ""))
                summary = params.get("summary", params.get("title", "New Issue"))
                description = params.get("description", params.get("desc", ""))
                issue_type_map = {"create_bug": "Bug", "create_task": "Task", "create_issue": "Task"}
                issue_type = issue_type_map.get(action, "Task")

                payload = {
                    "fields": {
                        "project": {"key": project_key},
                        "summary": summary,
                        "description": {
                            "type": "doc", "version": 1,
                            "content": [{"type": "paragraph", "content": [{"type": "text", "text": description}]}],
                        },
                        "issuetype": {"name": issue_type},
                    }
                }

                async with httpx.AsyncClient(timeout=15) as client:
                    resp = await client.post(
                        f"{base_url}/issue",
                        json=payload,
                        headers=headers,
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

            if action == "update_issue":
                issue_key = params.get("issue_key", params.get("key", ""))
                updates = params.get("updates", {})
                async with httpx.AsyncClient(timeout=15) as client:
                    resp = await client.put(
                        f"{base_url}/issue/{issue_key}",
                        json={"fields": updates},
                        headers=headers,
                    )
                    return IntegrationAction(
                        success=resp.status_code in (200, 204),
                        action=action,
                        result={"status": resp.status_code},
                    )

            return IntegrationAction(
                success=False, action=action,
                error=f"Ação desconhecida: {action}",
            )
        except Exception as exc:
            return IntegrationAction(
                success=False, action=action, error=str(exc),
            )

    async def validate_credentials(self) -> bool:
        return False  # requires user_id
