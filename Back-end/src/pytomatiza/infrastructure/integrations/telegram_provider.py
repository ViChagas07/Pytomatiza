"""Telegram Integration Provider — send messages, documents, health check."""

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


class TelegramProvider:
    service_name = "telegram"

    def __init__(self, bot_token: str = "") -> None:
        self._token = bot_token or getattr(settings, "TELEGRAM_BOT_TOKEN", "")
        self._base = f"https://api.telegram.org/bot{self._token}"

    async def health_check(self, **kwargs: Any) -> IntegrationHealth:
        if not self._token:
            return IntegrationHealth(service=self.service_name, connected=False, status="disconnected", message="No token configured")
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(f"{self._base}/getMe")
                if resp.status_code == 200:
                    data = resp.json()
                    if data.get("ok"):
                        return IntegrationHealth(service=self.service_name, connected=True, status="connected", message="Bot authenticated", details={"username": data["result"].get("username", "")})
                return IntegrationHealth(service=self.service_name, connected=False, status="error", message=f"HTTP {resp.status_code}")
        except Exception as exc:
            return IntegrationHealth(service=self.service_name, connected=False, status="error", message=str(exc))

    async def execute_action(self, action: str, params: dict[str, Any], **kwargs: Any) -> IntegrationAction:
        try:
            if action == "send_message":
                return await self._send("sendMessage", params)
            if action == "send_document":
                return await self._send("sendDocument", params)
            if action == "send_photo":
                return await self._send("sendPhoto", params)
            return IntegrationAction(success=False, action=action, error=f"Unknown action: {action}")
        except Exception as exc:
            return IntegrationAction(success=False, action=action, error=str(exc))

    async def validate_credentials(self) -> bool:
        health = await self.health_check()
        return health.connected

    async def _send(self, method: str, params: dict[str, Any]) -> IntegrationAction:
        chat_id = params.get("chat_id", params.get("channel", ""))
        text = params.get("content", params.get("message", params.get("text", "")))
        url = f"{self._base}/{method}"
        payload: dict[str, Any] = {"chat_id": chat_id}
        if method == "sendMessage":
            payload["text"] = text
        elif method == "sendDocument":
            payload["document"] = params.get("file_url", params.get("document", ""))
            payload["caption"] = text
        elif method == "sendPhoto":
            payload["photo"] = params.get("file_url", params.get("photo", ""))
            payload["caption"] = text
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(url, json=payload)
            data = resp.json()
            return IntegrationAction(success=data.get("ok", False), action=method, result=data)
