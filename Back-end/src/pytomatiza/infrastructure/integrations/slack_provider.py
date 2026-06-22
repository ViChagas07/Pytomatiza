"""Slack Integration Provider — messages, channels, notifications via Bot Token."""

from __future__ import annotations

import logging
from typing import Any
from uuid import UUID

import httpx

from pytomatiza.config import settings
from pytomatiza.domain.services.integrations.provider import (
    IntegrationAction,
    IntegrationHealth,
)

logger = logging.getLogger(__name__)

_SLACK_API_BASE = "https://slack.com/api"


class SlackProvider:
    service_name = "slack"
    _bot_token: str = ""

    def __init__(self) -> None:
        self._bot_token = settings.SLACK_BOT_TOKEN

    async def health_check(self, user_id: UUID | None = None) -> IntegrationHealth:
        token = self._bot_token
        if not token:
            return IntegrationHealth(
                service=self.service_name, connected=False,
                status="disconnected",
                message="SLACK_BOT_TOKEN not configured in .env"
            )
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.post(
                    f"{_SLACK_API_BASE}/auth.test",
                    headers={"Authorization": f"Bearer {token}"},
                )
                if resp.status_code == 200:
                    data = resp.json()
                    if data.get("ok"):
                        team = data.get("team", "")
                        return IntegrationHealth(
                            service=self.service_name, connected=True,
                            status="connected",
                            message=f"Autenticado no workspace {team}"
                        )
                    error_msg = data.get("error", "unknown error")
                    return IntegrationHealth(
                        service=self.service_name, connected=False,
                        status="error",
                        message=f"Slack auth failed: {error_msg}"
                    )
                return IntegrationHealth(
                    service=self.service_name, connected=False,
                    status="error",
                    message=f"Slack API error ({resp.status_code})"
                )
        except Exception as exc:
            return IntegrationHealth(
                service=self.service_name, connected=False,
                status="error", message=str(exc)
            )

    async def execute_action(
        self, action: str, params: dict[str, Any],
        user_id: UUID | None = None,
    ) -> IntegrationAction:
        try:
            token = self._bot_token
            if not token:
                return IntegrationAction(
                    success=False, action=action,
                    error="SLACK_BOT_TOKEN not configured"
                )

            if action == "send_message":
                channel = params.get("channel", "")
                text = params.get("text", "")
                if not channel or not text:
                    return IntegrationAction(
                        success=False, action=action,
                        error="channel and text are required"
                    )
                async with httpx.AsyncClient(timeout=10) as client:
                    resp = await client.post(
                        f"{_SLACK_API_BASE}/chat.postMessage",
                        headers={
                            "Authorization": f"Bearer {token}",
                            "Content-Type": "application/json",
                        },
                        json={"channel": channel, "text": text},
                    )
                    if resp.status_code != 200:
                        return IntegrationAction(
                            success=False, action=action,
                            error=f"Slack API error ({resp.status_code})"
                        )
                    data = resp.json()
                    if not data.get("ok"):
                        return IntegrationAction(
                            success=False, action=action,
                            error=f"Slack error: {data.get('error', '')}"
                        )
                    return IntegrationAction(
                        success=True, action=action, result=data
                    )

            if action == "list_channels":
                async with httpx.AsyncClient(timeout=10) as client:
                    resp = await client.get(
                        f"{_SLACK_API_BASE}/conversations.list",
                        headers={"Authorization": f"Bearer {token}"},
                        params={"types": "public_channel,private_channel"},
                    )
                    if resp.status_code != 200:
                        return IntegrationAction(
                            success=False, action=action,
                            error=f"Slack API error ({resp.status_code})"
                        )
                    data = resp.json()
                    if not data.get("ok"):
                        return IntegrationAction(
                            success=False, action=action,
                            error=f"Slack error: {data.get('error', '')}"
                        )
                    return IntegrationAction(
                        success=True, action=action, result=data
                    )

            return IntegrationAction(
                success=False, action=action,
                error=f"Unknown action: {action}"
            )
        except Exception as exc:
            return IntegrationAction(
                success=False, action=action, error=str(exc)
            )

    async def validate_credentials(self) -> bool:
        health = await self.health_check()
        return health.connected
