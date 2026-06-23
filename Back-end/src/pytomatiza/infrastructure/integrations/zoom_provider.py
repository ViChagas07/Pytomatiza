"""Zoom Integration Provider — OAuth 3LO per-user, meetings, webinars.

Each user connects their own Zoom account via OAuth. The token is stored
encrypted in ``integration_tokens`` and used for all API calls.

Replaces the previous Server-to-Server OAuth (account_credentials) which
acted as a single global account.
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
from pytomatiza.infrastructure.security.token_encryption import (
    TokenEncryptionService,
)

logger = logging.getLogger(__name__)

_ZOOM_API_BASE = "https://api.zoom.us/v2"


class ZoomProvider(IntegrationProvider):
    service_name = "zoom"

    async def _get_token(self, user_id: UUID | None = None) -> IntegrationToken | None:
        """Load the Zoom OAuth token for a user from the database."""
        if user_id is None:
            return None
        async with AsyncSessionLocal() as session:
            repo = IntegrationTokenRepository(session)
            return await repo.find_by_user_and_service(
                user_id=user_id,
                provider="zoom",
                service="meetings",
            )

    async def health_check(self, user_id: UUID | None = None) -> IntegrationHealth:
        token = await self._get_token(user_id)
        if token is None:
            return IntegrationHealth(
                service=self.service_name, connected=False,
                status="disconnected",
                message="Zoom não conectado — autorize sua conta",
            )
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(
                    f"{_ZOOM_API_BASE}/users/me",
                    headers={"Authorization": f"Bearer {token.access_token}"},
                )
                if resp.status_code == 200:
                    data = resp.json()
                    email = data.get("email", token.external_account_name)
                    return IntegrationHealth(
                        service=self.service_name, connected=True,
                        status="connected",
                        message=f"Autenticado como {email}",
                        details={
                            "email": email,
                            "account_id": token.external_account_id,
                        },
                    )
                return IntegrationHealth(
                    service=self.service_name, connected=False,
                    status="error",
                    message=f"Zoom API error ({resp.status_code})",
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
                    error="Zoom não conectado. Conecte sua conta primeiro.",
                )
            access_token = token.access_token

            if action == "create_meeting":
                topic = params.get("topic", "Meeting")
                duration = params.get("duration", 30)
                start_time = params.get("start_time", "")
                async with httpx.AsyncClient(timeout=15) as client:
                    resp = await client.post(
                        f"{_ZOOM_API_BASE}/users/me/meetings",
                        headers={
                            "Authorization": f"Bearer {access_token}",
                            "Content-Type": "application/json",
                        },
                        json={
                            "topic": topic,
                            "type": 2,
                            "start_time": start_time,
                            "duration": duration,
                            "timezone": params.get("timezone", "UTC"),
                            "settings": {
                                "host_video": params.get("host_video", True),
                                "participant_video": params.get("participant_video", True),
                                "join_before_host": params.get("join_before_host", False),
                            },
                        },
                    )
                    if resp.status_code not in (200, 201):
                        return IntegrationAction(
                            success=False, action=action,
                            error=f"Zoom API error ({resp.status_code}): {resp.text[:200]}",
                        )
                    return IntegrationAction(
                        success=True, action=action, result=resp.json(),
                    )

            if action == "list_meetings":
                async with httpx.AsyncClient(timeout=10) as client:
                    resp = await client.get(
                        f"{_ZOOM_API_BASE}/users/me/meetings",
                        headers={"Authorization": f"Bearer {access_token}"},
                        params={"page_size": params.get("page_size", 30)},
                    )
                    if resp.status_code != 200:
                        return IntegrationAction(
                            success=False, action=action,
                            error=f"Zoom API error ({resp.status_code})",
                        )
                    return IntegrationAction(
                        success=True, action=action, result=resp.json(),
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
