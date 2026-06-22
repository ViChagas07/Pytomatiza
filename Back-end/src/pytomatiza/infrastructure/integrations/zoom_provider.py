"""Zoom Integration Provider — meetings, webinars via Server-to-Server OAuth."""

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

_ZOOM_OAUTH_URL = "https://zoom.us/oauth/token"
_ZOOM_API_BASE = "https://api.zoom.us/v2"


class ZoomProvider:
    service_name = "zoom"
    _account_id: str = ""
    _client_id: str = ""
    _client_secret: str = ""

    def __init__(self) -> None:
        self._account_id = settings.ZOOM_ACCOUNT_ID
        self._client_id = settings.ZOOM_CLIENT_ID
        self._client_secret = settings.ZOOM_CLIENT_SECRET

    async def _get_access_token(self) -> str | None:
        """Obtain a server-to-server OAuth access token from Zoom."""
        if not self._account_id or not self._client_id or not self._client_secret:
            return None
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.post(
                    _ZOOM_OAUTH_URL,
                    params={
                        "grant_type": "account_credentials",
                        "account_id": self._account_id,
                    },
                    auth=(self._client_id, self._client_secret),
                )
                if resp.status_code == 200:
                    data = resp.json()
                    return data.get("access_token")
                logger.warning(
                    "Zoom OAuth failed (%s): %s", resp.status_code, resp.text[:200]
                )
                return None
        except Exception as exc:
            logger.warning("Zoom OAuth exception: %s", exc)
            return None

    async def health_check(self, user_id: UUID | None = None) -> IntegrationHealth:
        access_token = await self._get_access_token()
        if access_token is None:
            return IntegrationHealth(
                service=self.service_name, connected=False,
                status="disconnected",
                message="Zoom credentials not configured or invalid in .env"
            )
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(
                    f"{_ZOOM_API_BASE}/users/me",
                    headers={"Authorization": f"Bearer {access_token}"},
                )
                if resp.status_code == 200:
                    data = resp.json()
                    email = data.get("email", "")
                    return IntegrationHealth(
                        service=self.service_name, connected=True,
                        status="connected",
                        message=f"Autenticado como {email}"
                    )
                return IntegrationHealth(
                    service=self.service_name, connected=False,
                    status="error",
                    message=f"Zoom API error ({resp.status_code})"
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
            access_token = await self._get_access_token()
            if access_token is None:
                return IntegrationAction(
                    success=False, action=action,
                    error="Zoom credentials not configured"
                )

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
                            error=f"Zoom API error ({resp.status_code}): {resp.text[:200]}"
                        )
                    return IntegrationAction(
                        success=True, action=action, result=resp.json()
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
                            error=f"Zoom API error ({resp.status_code})"
                        )
                    return IntegrationAction(
                        success=True, action=action, result=resp.json()
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
