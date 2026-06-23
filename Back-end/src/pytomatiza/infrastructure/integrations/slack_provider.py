"""Slack Integration Provider — OAuth per-workspace, messages, channels, notifications.

Each workspace connection is stored as an ``IntegrationToken`` in the
database (encrypted). ``health_check()`` and ``execute_action()`` load
the correct token for the calling user — never a global bot token.
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

_SLACK_API_BASE = "https://slack.com/api"


class SlackProvider(IntegrationProvider):
    service_name = "slack"

    async def _get_token(self, user_id: UUID | None = None) -> IntegrationToken | None:
        """Load the Slack workspace token for a user from the database."""
        if user_id is None:
            return None
        async with AsyncSessionLocal() as session:
            repo = IntegrationTokenRepository(session)
            return await repo.find_by_user_and_service(
                user_id=user_id,
                provider="slack",
                service="workspace",
            )

    async def health_check(self, user_id: UUID | None = None) -> IntegrationHealth:
        token = await self._get_token(user_id)
        if token is None:
            return IntegrationHealth(
                service=self.service_name, connected=False,
                status="disconnected",
                message="Slack não conectado — autorize via Conectar",
            )
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.post(
                    f"{_SLACK_API_BASE}/auth.test",
                    headers={"Authorization": f"Bearer {token.access_token}"},
                )
                if resp.status_code == 200:
                    data = resp.json()
                    if data.get("ok"):
                        team = data.get("team", token.external_account_name)
                        return IntegrationHealth(
                            service=self.service_name, connected=True,
                            status="connected",
                            message=f"Autenticado no workspace {team}",
                            details={
                                "workspace": team,
                                "workspace_id": token.external_account_id,
                            },
                        )
                    error_msg = data.get("error", "unknown error")
                    return IntegrationHealth(
                        service=self.service_name, connected=False,
                        status="error",
                        message=f"Slack auth failed: {error_msg}",
                    )
                return IntegrationHealth(
                    service=self.service_name, connected=False,
                    status="error",
                    message=f"Slack API error ({resp.status_code})",
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
                    error="Slack não conectado. Conecte um workspace primeiro.",
                )
            access_token = token.access_token

            if action == "send_message":
                channel = params.get("channel", "")
                text = params.get("text", "")
                if not channel or not text:
                    return IntegrationAction(
                        success=False, action=action,
                        error="channel e text são obrigatórios",
                    )
                async with httpx.AsyncClient(timeout=10) as client:
                    resp = await client.post(
                        f"{_SLACK_API_BASE}/chat.postMessage",
                        headers={
                            "Authorization": f"Bearer {access_token}",
                            "Content-Type": "application/json",
                        },
                        json={"channel": channel, "text": text},
                    )
                    if resp.status_code != 200:
                        return IntegrationAction(
                            success=False, action=action,
                            error=f"Slack API error ({resp.status_code})",
                        )
                    data = resp.json()
                    if not data.get("ok"):
                        return IntegrationAction(
                            success=False, action=action,
                            error=f"Slack error: {data.get('error', '')}",
                        )
                    return IntegrationAction(
                        success=True, action=action, result=data,
                    )

            if action == "list_channels":
                async with httpx.AsyncClient(timeout=10) as client:
                    resp = await client.get(
                        f"{_SLACK_API_BASE}/conversations.list",
                        headers={"Authorization": f"Bearer {access_token}"},
                        params={"types": "public_channel,private_channel"},
                    )
                    if resp.status_code != 200:
                        return IntegrationAction(
                            success=False, action=action,
                            error=f"Slack API error ({resp.status_code})",
                        )
                    data = resp.json()
                    if not data.get("ok"):
                        return IntegrationAction(
                            success=False, action=action,
                            error=f"Slack error: {data.get('error', '')}",
                        )
                    return IntegrationAction(
                        success=True, action=action, result=data,
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
        # Validate requires a user_id now — return False as fallback
        return False
