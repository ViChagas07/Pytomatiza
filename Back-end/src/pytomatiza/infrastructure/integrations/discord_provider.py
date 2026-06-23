"""Discord Integration Provider — OAuth2 installs the bot in a guild,
then actions are performed using the global DISCORD_BOT_TOKEN on the guilds
the user has authorized.

The ``IntegrationToken`` stores the guild connection (guild_id, guild_name)
per user. The global bot token is used for API calls since Discord uses
a single bot identity across all guilds.
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


class DiscordProvider:
    service_name = "discord"
    _bot_token: str = ""

    def __init__(self) -> None:
        self._bot_token = settings.DISCORD_BOT_TOKEN

    async def _get_token(self, user_id: UUID | None = None) -> IntegrationToken | None:
        """Load the Discord guild connection for a user from the database."""
        if user_id is None:
            return None
        async with AsyncSessionLocal() as session:
            repo = IntegrationTokenRepository(session)
            return await repo.find_by_user_and_service(
                user_id=user_id,
                provider="discord",
                service="bot",
            )

    @property
    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bot {self._bot_token}",
            "Content-Type": "application/json",
        }

    async def health_check(self, user_id: UUID | None = None) -> IntegrationHealth:
        token = await self._get_token(user_id)
        if token is None:
            return IntegrationHealth(
                service=self.service_name, connected=False,
                status="disconnected",
                message="Discord não conectado — autorize o bot em um servidor",
            )
        if not self._bot_token:
            return IntegrationHealth(
                service=self.service_name, connected=False,
                status="error",
                message="DISCORD_BOT_TOKEN não configurado no servidor",
            )

        guild_id = token.external_account_id
        guild_name = token.external_account_name
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(
                    f"https://discord.com/api/v10/guilds/{guild_id}",
                    headers=self._headers,
                )
                if resp.status_code == 200:
                    data = resp.json()
                    return IntegrationHealth(
                        service=self.service_name, connected=True,
                        status="connected",
                        message=f"Bot presente no servidor {data.get('name', guild_name)}",
                        details={
                            "guild_id": guild_id,
                            "guild_name": data.get("name", guild_name),
                        },
                    )
                if resp.status_code == 404:
                    return IntegrationHealth(
                        service=self.service_name, connected=False,
                        status="disconnected",
                        message="Bot foi removido do servidor",
                    )
                return IntegrationHealth(
                    service=self.service_name, connected=False,
                    status="error",
                    message=f"Discord API error ({resp.status_code})",
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
            # For Discord, we need the user's guild connection to identify
            # which guild to act on, but API calls use the global bot token.
            if not self._bot_token:
                return IntegrationAction(
                    success=False, action=action,
                    error="DISCORD_BOT_TOKEN não configurado",
                )

            if action == "send_message":
                channel_id = params.get("channel_id", "")
                content = params.get("content", params.get("message", ""))
                if not channel_id or not content:
                    return IntegrationAction(
                        success=False, action=action,
                        error="channel_id e content são obrigatórios",
                    )
                async with httpx.AsyncClient(timeout=15) as client:
                    resp = await client.post(
                        f"https://discord.com/api/v10/channels/{channel_id}/messages",
                        headers=self._headers,
                        json={"content": content},
                    )
                    if resp.status_code in (200, 201):
                        return IntegrationAction(
                            success=True, action=action, result=resp.json(),
                        )
                    return IntegrationAction(
                        success=False, action=action,
                        error=f"HTTP {resp.status_code}: {resp.text[:200]}",
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
        if not self._bot_token:
            return False
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(
                    "https://discord.com/api/v10/users/@me",
                    headers=self._headers,
                )
                return resp.status_code == 200
        except Exception:
            return False
