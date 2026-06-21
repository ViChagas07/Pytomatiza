"""WhatsApp Business Integration Provider — send messages via Cloud API."""

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


class WhatsAppProvider:
    service_name = "whatsapp"

    def __init__(self, access_token: str = "", phone_number_id: str = "") -> None:
        self._token = access_token or getattr(settings, "WHATSAPP_ACCESS_TOKEN", "")
        self._phone_id = phone_number_id or getattr(settings, "WHATSAPP_PHONE_NUMBER_ID", "")
        self._base = f"https://graph.facebook.com/v20.0/{self._phone_id}"

    async def health_check(self, **kwargs: Any) -> IntegrationHealth:
        if not self._token or not self._phone_id:
            return IntegrationHealth(service=self.service_name, connected=False, status="disconnected", message="Missing token or phone_number_id")
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(self._base, headers={"Authorization": f"Bearer {self._token}"})
                if resp.status_code == 200:
                    return IntegrationHealth(service=self.service_name, connected=True, status="connected", message="WhatsApp Cloud API accessible")
                return IntegrationHealth(service=self.service_name, connected=False, status="error", message=f"HTTP {resp.status_code}")
        except Exception as exc:
            return IntegrationHealth(service=self.service_name, connected=False, status="error", message=str(exc))

    async def execute_action(self, action: str, params: dict[str, Any], **kwargs: Any) -> IntegrationAction:
        try:
            if action == "send_message":
                return await self._send_message(params)
            return IntegrationAction(success=False, action=action, error=f"Unknown action: {action}")
        except Exception as exc:
            return IntegrationAction(success=False, action=action, error=str(exc))

    async def validate_credentials(self) -> bool:
        health = await self.health_check()
        return health.connected

    async def _send_message(self, params: dict[str, Any]) -> IntegrationAction:
        to_number = params.get("to", params.get("phone", ""))
        content = params.get("content", params.get("message", ""))
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": to_number,
            "type": "text",
            "text": {"preview_url": False, "body": content},
        }
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(f"{self._base}/messages", headers={"Authorization": f"Bearer {self._token}", "Content-Type": "application/json"}, json=payload)
            return IntegrationAction(success=resp.status_code in (200, 201), action="send_message", result=resp.json() if resp.text else {"status": resp.status_code})
