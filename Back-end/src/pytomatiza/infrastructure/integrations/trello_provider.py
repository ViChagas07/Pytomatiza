"""Trello Integration Provider — create/move/update cards, health check."""

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


class TrelloProvider:
    service_name = "trello"

    def __init__(self, api_key: str = "", api_token: str = "") -> None:
        self._key = api_key or getattr(settings, "TRELLO_API_KEY", "")
        self._token = api_token or getattr(settings, "TRELLO_API_TOKEN", "")
        self._base = "https://api.trello.com/1"

    @property
    def _auth_params(self) -> dict[str, str]:
        return {"key": self._key, "token": self._token}

    async def health_check(self, **kwargs: Any) -> IntegrationHealth:
        if not self._key or not self._token:
            return IntegrationHealth(service=self.service_name, connected=False, status="disconnected", message="Missing API key or token")
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(f"{self._base}/members/me", params=self._auth_params)
                if resp.status_code == 200:
                    data = resp.json()
                    return IntegrationHealth(service=self.service_name, connected=True, status="connected", message="Authenticated", details={"username": data.get("username", "")})
                return IntegrationHealth(service=self.service_name, connected=False, status="error", message=f"HTTP {resp.status_code}")
        except Exception as exc:
            return IntegrationHealth(service=self.service_name, connected=False, status="error", message=str(exc))

    async def execute_action(self, action: str, params: dict[str, Any], **kwargs: Any) -> IntegrationAction:
        try:
            if action == "create_card":
                return await self._create_card(params)
            if action == "move_card":
                return await self._move_card(params)
            if action == "update_card":
                return await self._update_card(params)
            return IntegrationAction(success=False, action=action, error=f"Unknown action: {action}")
        except Exception as exc:
            return IntegrationAction(success=False, action=action, error=str(exc))

    async def validate_credentials(self) -> bool:
        health = await self.health_check()
        return health.connected

    async def _create_card(self, params: dict[str, Any]) -> IntegrationAction:
        list_id = params.get("list_id", "")
        name = params.get("name", params.get("title", "New Card"))
        desc = params.get("description", params.get("desc", ""))
        payload: dict[str, Any] = {"idList": list_id, "name": name, "desc": desc}
        payload.update(self._auth_params)
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(f"{self._base}/cards", json=payload)
            return IntegrationAction(success=resp.status_code == 200, action="create_card", result=resp.json() if resp.text else {})

    async def _move_card(self, params: dict[str, Any]) -> IntegrationAction:
        card_id = params.get("card_id", "")
        list_id = params.get("list_id", "")
        payload = {"idList": list_id, **self._auth_params}
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.put(f"{self._base}/cards/{card_id}", json=payload)
            return IntegrationAction(success=resp.status_code == 200, action="move_card", result=resp.json() if resp.text else {})

    async def _update_card(self, params: dict[str, Any]) -> IntegrationAction:
        card_id = params.get("card_id", "")
        updates = {k: v for k, v in params.items() if k in ("name", "desc", "due", "closed")}
        updates.update(self._auth_params)
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.put(f"{self._base}/cards/{card_id}", json=updates)
            return IntegrationAction(success=resp.status_code == 200, action="update_card", result=resp.json() if resp.text else {})
