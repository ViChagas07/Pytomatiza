"""Facebook Pages Integration Provider — publish posts, respond to events."""

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


class FacebookProvider:
    service_name = "facebook"

    def __init__(self, access_token: str = "", page_id: str = "") -> None:
        self._token = access_token or getattr(settings, "FACEBOOK_ACCESS_TOKEN", "")
        self._page_id = page_id or getattr(settings, "FACEBOOK_PAGE_ID", "")
        self._base = "https://graph.facebook.com/v20.0"

    async def health_check(self, **kwargs: Any) -> IntegrationHealth:
        if not self._token:
            return IntegrationHealth(service=self.service_name, connected=False, status="disconnected", message="No token configured")
        try:
            url = f"{self._base}/me?access_token={self._token}" if not self._page_id else f"{self._base}/{self._page_id}?fields=name&access_token={self._token}"
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(url)
                if resp.status_code == 200:
                    data = resp.json()
                    return IntegrationHealth(service=self.service_name, connected=True, status="connected", message="Page accessible", details={"name": data.get("name", "")})
                return IntegrationHealth(service=self.service_name, connected=False, status="error", message=f"HTTP {resp.status_code}")
        except Exception as exc:
            return IntegrationHealth(service=self.service_name, connected=False, status="error", message=str(exc))

    async def execute_action(self, action: str, params: dict[str, Any], **kwargs: Any) -> IntegrationAction:
        try:
            if action == "create_post":
                return await self._create_post(params)
            return IntegrationAction(success=False, action=action, error=f"Unknown action: {action}")
        except Exception as exc:
            return IntegrationAction(success=False, action=action, error=str(exc))

    async def validate_credentials(self) -> bool:
        health = await self.health_check()
        return health.connected

    async def _create_post(self, params: dict[str, Any]) -> IntegrationAction:
        page = params.get("page_id", self._page_id)
        message = params.get("content", params.get("message", ""))
        url = f"{self._base}/{page}/feed"
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(url, params={"access_token": self._token, "message": message})
            return IntegrationAction(success=resp.status_code in (200, 201), action="create_post", result=resp.json() if resp.text else {"status": resp.status_code})
