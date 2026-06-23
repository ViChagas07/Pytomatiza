"""Telegram Integration Provider — Bot Token per-user (stored encrypted in DB).

Telegram Bot API does not support OAuth. Each user registers their own bot
token via the frontend. The token is validated with ``getMe()``, encrypted,
and stored in ``integration_tokens``.

Never use a global ``TELEGRAM_BOT_TOKEN`` from .env.
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
)
from pytomatiza.infrastructure.db.session import AsyncSessionLocal
from pytomatiza.infrastructure.repositories.integration_token_repository import (
    IntegrationTokenRepository,
)

logger = logging.getLogger(__name__)


class TelegramProvider:
    service_name = "telegram"

    async def _get_token(self, user_id: UUID | None = None) -> IntegrationToken | None:
        """Load the Telegram bot token for a user from the database."""
        if user_id is None:
            return None
        async with AsyncSessionLocal() as session:
            repo = IntegrationTokenRepository(session)
            return await repo.find_by_user_and_service(
                user_id=user_id,
                provider="telegram",
                service="bot",
            )

    async def health_check(self, user_id: UUID | None = None) -> IntegrationHealth:
        token = await self._get_token(user_id)
        if token is None:
            return IntegrationHealth(
                service=self.service_name, connected=False,
                status="disconnected",
                message="Telegram não conectado — registre seu bot",
            )
        try:
            base = f"https://api.telegram.org/bot{token.access_token}"
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(f"{base}/getMe")
                if resp.status_code == 200 and resp.json().get("ok"):
                    bot_info = resp.json().get("result", {})
                    username = bot_info.get("username", token.external_account_name)
                    return IntegrationHealth(
                        service=self.service_name, connected=True,
                        status="connected",
                        message=f"Bot @{username} ativo",
                        details={"username": username},
                    )
                return IntegrationHealth(
                    service=self.service_name, connected=False,
                    status="error",
                    message=f"Telegram API error ({resp.status_code})",
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
                    error="Telegram não conectado. Registre seu bot primeiro.",
                )

            base = f"https://api.telegram.org/bot{token.access_token}"
            chat_id = params.get("chat_id", params.get("channel", ""))
            text = params.get("content", params.get("message", params.get("text", "")))

            if action in ("send_message", "send_document", "send_photo"):
                method_map = {
                    "send_message": "sendMessage",
                    "send_document": "sendDocument",
                    "send_photo": "sendPhoto",
                }
                method = method_map[action]
                url = f"{base}/{method}"
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
                    return IntegrationAction(
                        success=data.get("ok", False),
                        action=action,
                        result=data,
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
