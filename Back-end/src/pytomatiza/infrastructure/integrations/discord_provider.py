"""Discord Integration Provider — send messages, manage webhooks, health check."""

from __future__ import annotations

import logging
from typing import Any

import httpx

from pytomatiza.config import settings
from pytomatiza.domain.services.integrations.provider import (
    IntegrationAction,
    IntegrationHealth,
)

logger = logging.getLogger(__name__)


class DiscordProvider:
    service_name = "discord"

    def __init__(self, bot_token: str = "") -> None:
        self._token = bot_token or getattr(settings, "DISCORD_BOT_TOKEN", "")
        self._base = "https://discord.com/api/v10"

    @property
    def _headers(self) -> dict[str, str]:
        return {"Authorization": f"Bot {self._token}", "Content-Type": "application/json"}

    async def health_check(self) -> IntegrationHealth:
        if not self._token:
            return IntegrationHealth(service=self.service_name, connected=False, status="disconnected", message="No token configured")
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(f"{self._base}/users/@me", headers=self._headers)
                if resp.status_code == 200:
                    data = resp.json()
                    return IntegrationHealth(service=self.service_name, connected=True, status="connected", message="Bot authenticated", details={"username": data.get("username", "")})
                return IntegrationHealth(service=self.service_name, connected=False, status="error", message=f"HTTP {resp.status_code}: {resp.text[:200]}")
        except Exception as exc:
            return IntegrationHealth(service=self.service_name, connected=False, status="error", message=str(exc))

    async def execute_action(self, action: str, params: dict[str, Any]) -> IntegrationAction:
        try:
            if action == "send_message":
                return await self._send_message(params)
            if action == "send_webhook":
                return await self._send_webhook(params)
            return IntegrationAction(success=False, action=action, error=f"Unknown action: {action}")
        except Exception as exc:
            return IntegrationAction(success=False, action=action, error=str(exc))

    async def validate_credentials(self) -> bool:
        health = await self.health_check()
        return health.connected

    async def _send_message(self, params: dict[str, Any]) -> IntegrationAction:
        channel_id = params.get("channel_id", "")
        content = params.get("content", params.get("message", ""))
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(f"{self._base}/channels/{channel_id}/messages", headers=self._headers, json={"content": content})
            if resp.status_code in (200, 201):
                return IntegrationAction(success=True, action="send_message", result=resp.json())
            return IntegrationAction(success=False, action="send_message", error=f"HTTP {resp.status_code}: {resp.text[:200]}")

    async def _send_webhook(self, params: dict[str, Any]) -> IntegrationAction:
        webhook_url = params.get("webhook_url", "")
        content = params.get("content", params.get("message", ""))
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(webhook_url, json={"content": content})
            return IntegrationAction(success=resp.status_code in (200, 204), action="send_webhook", result={"status": resp.status_code})
