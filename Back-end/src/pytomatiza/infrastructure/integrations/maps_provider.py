"""Google Maps Integration Provider — geocoding, directions, places via API key."""

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

_GOOGLE_MAPS_GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json"


class GoogleMapsProvider:
    service_name = "google_maps"
    _api_key: str = ""

    def __init__(self) -> None:
        self._api_key = settings.GOOGLE_MAPS_API_KEY

    async def health_check(self, user_id: UUID | None = None) -> IntegrationHealth:
        key = self._api_key
        if not key:
            return IntegrationHealth(
                service=self.service_name, connected=False,
                status="disconnected",
                message="GOOGLE_MAPS_API_KEY not configured in .env"
            )
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(
                    _GOOGLE_MAPS_GEOCODE_URL,
                    params={"address": "test", "key": key},
                )
                if resp.status_code == 200:
                    data = resp.json()
                    if data.get("status") == "OK":
                        return IntegrationHealth(
                            service=self.service_name, connected=True,
                            status="connected",
                            message="Google Maps API accessible"
                        )
                    if data.get("status") == "REQUEST_DENIED":
                        return IntegrationHealth(
                            service=self.service_name, connected=False,
                            status="error",
                            message=f"Maps API denied: {data.get('error_message', '')}"
                        )
                    return IntegrationHealth(
                        service=self.service_name, connected=True,
                        status="connected",
                        message="Maps API key is valid"
                    )
                return IntegrationHealth(
                    service=self.service_name, connected=False,
                    status="error",
                    message=f"Maps API error ({resp.status_code})"
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
            key = self._api_key
            if not key:
                return IntegrationAction(
                    success=False, action=action,
                    error="GOOGLE_MAPS_API_KEY not configured"
                )

            if action == "geocode":
                address = params.get("address", "")
                if not address:
                    return IntegrationAction(
                        success=False, action=action,
                        error="address parameter is required"
                    )
                async with httpx.AsyncClient(timeout=10) as client:
                    resp = await client.get(
                        _GOOGLE_MAPS_GEOCODE_URL,
                        params={"address": address, "key": key},
                    )
                    if resp.status_code != 200:
                        return IntegrationAction(
                            success=False, action=action,
                            error=f"Maps API error ({resp.status_code})"
                        )
                    return IntegrationAction(
                        success=True, action=action, result=resp.json()
                    )

            if action == "reverse_geocode":
                lat = params.get("lat")
                lng = params.get("lng")
                if lat is None or lng is None:
                    return IntegrationAction(
                        success=False, action=action,
                        error="lat and lng parameters are required"
                    )
                async with httpx.AsyncClient(timeout=10) as client:
                    resp = await client.get(
                        _GOOGLE_MAPS_GEOCODE_URL,
                        params={
                            "latlng": f"{lat},{lng}",
                            "key": key,
                        },
                    )
                    if resp.status_code != 200:
                        return IntegrationAction(
                            success=False, action=action,
                            error=f"Maps API error ({resp.status_code})"
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
