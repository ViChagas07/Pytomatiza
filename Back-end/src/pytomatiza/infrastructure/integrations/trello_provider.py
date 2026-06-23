"""Trello Integration Provider — API Key (global) + User Token (per-tenant).

Trello does not use OAuth 2.0. Instead it uses:
  - ``TRELLO_API_KEY``: global app identifier (from .env)
  - User Token: generated per user via Trello's authorization redirect

The user token is stored encrypted in ``integration_tokens``.
The API key remains global.

Flow:
  1. Frontend redirects user to Trello's authorize URL
  2. User approves → Trello redirects with #token=USER_TOKEN
  3. Frontend sends token to backend → backend saves to integration_tokens
  4. Provider reads both key and token to make API calls
"""

from __future__ import annotations

import logging
from typing import Any
from uuid import UUID

import httpx

from pytomatiza.config import settings
from pytomatiza.domain.entities.integration_token import IntegrationToken
from pytomatiza.domain.services.integrations.provider import (
    IntegrationAction,
    IntegrationHealth,
)
from pytomatiza.infrastructure.db.session import AsyncSessionLocal
from pytomatiza.infrastructure.repositories.integration_token_repository import (
    IntegrationTokenRepository,
)

logger = logging.getLogger(__name__)


class TrelloProvider:
    service_name = "trello"

    def __init__(self) -> None:
        self._api_key = settings.TRELLO_API_KEY

    async def _get_token(self, user_id: UUID | None = None) -> IntegrationToken | None:
        """Load the Trello user token for a user from the database."""
        if user_id is None:
            return None
        async with AsyncSessionLocal() as session:
            repo = IntegrationTokenRepository(session)
            return await repo.find_by_user_and_service(
                user_id=user_id,
                provider="trello",
                service="token",
            )

    @property
    def _base(self) -> str:
        return "https://api.trello.com/1"

    def _auth_params(self, token: IntegrationToken) -> dict[str, str]:
        return {"key": self._api_key, "token": token.access_token}

    async def health_check(self, user_id: UUID | None = None) -> IntegrationHealth:
        token = await self._get_token(user_id)
        if token is None or not self._api_key:
            return IntegrationHealth(
                service=self.service_name, connected=False,
                status="disconnected",
                message="Trello não conectado — autorize sua conta",
            )
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(
                    f"{self._base}/members/me",
                    params=self._auth_params(token),
                )
                if resp.status_code == 200:
                    data = resp.json()
                    username = data.get("username", token.external_account_name)
                    return IntegrationHealth(
                        service=self.service_name, connected=True,
                        status="connected",
                        message=f"Autenticado como {username}",
                        details={"username": username},
                    )
                return IntegrationHealth(
                    service=self.service_name, connected=False,
                    status="error",
                    message=f"Trello API error ({resp.status_code})",
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
            if token is None or not self._api_key:
                return IntegrationAction(
                    success=False, action=action,
                    error="Trello não conectado. Conecte sua conta primeiro.",
                )
            auth = self._auth_params(token)

            if action == "create_card":
                list_id = params.get("list_id", "")
                name = params.get("name", params.get("title", "New Card"))
                desc = params.get("description", params.get("desc", ""))
                payload: dict[str, Any] = {"idList": list_id, "name": name, "desc": desc}
                payload.update(auth)
                async with httpx.AsyncClient(timeout=15) as client:
                    resp = await client.post(f"{self._base}/cards", json=payload)
                    return IntegrationAction(
                        success=resp.status_code == 200,
                        action=action,
                        result=resp.json() if resp.text else {},
                    )

            if action == "move_card":
                card_id = params.get("card_id", "")
                list_id = params.get("list_id", "")
                payload = {"idList": list_id, **auth}
                async with httpx.AsyncClient(timeout=15) as client:
                    resp = await client.put(f"{self._base}/cards/{card_id}", json=payload)
                    return IntegrationAction(
                        success=resp.status_code == 200,
                        action=action,
                        result=resp.json() if resp.text else {},
                    )

            if action == "update_card":
                card_id = params.get("card_id", "")
                updates = {k: v for k, v in params.items() if k in ("name", "desc", "due", "closed")}
                updates.update(auth)
                async with httpx.AsyncClient(timeout=15) as client:
                    resp = await client.put(f"{self._base}/cards/{card_id}", json=updates)
                    return IntegrationAction(
                        success=resp.status_code == 200,
                        action=action,
                        result=resp.json() if resp.text else {},
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
        if not self._api_key:
            return False
        return True
