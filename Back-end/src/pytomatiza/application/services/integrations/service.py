"""Integration Service — registry and health checks for all providers."""

from __future__ import annotations

import logging
from typing import Any
from uuid import UUID

from pytomatiza.domain.services.integrations.provider import (
    IntegrationHealth,
    IntegrationProvider,
)
from pytomatiza.infrastructure.integrations import (
    DiscordProvider,
    FacebookProvider,
    GmailProvider,
    GoogleDriveProvider,
    JiraProvider,
    TelegramProvider,
    TrelloProvider,
    WhatsAppProvider,
)

logger = logging.getLogger(__name__)

# Future providers (show as "coming_soon")
_FUTURE_PROVIDERS: list[dict[str, Any]] = [
    {"service": "instagram", "label": "Instagram", "icon": "instagram"},
    {"service": "linkedin", "label": "LinkedIn", "icon": "linkedin"},
    {"service": "teams", "label": "Microsoft Teams", "icon": "teams"},
]


class IntegrationService:
    """Central registry for all third‑party integration providers."""

    def __init__(self) -> None:
        self._providers: dict[str, IntegrationProvider] = {}
        self._register_defaults()

    def _register_defaults(self) -> None:
        providers = [
            DiscordProvider(),
            TelegramProvider(),
            WhatsAppProvider(),
            FacebookProvider(),
            TrelloProvider(),
            JiraProvider(),
            GoogleDriveProvider(),
            GmailProvider(),
        ]
        for p in providers:
            self._providers[p.service_name] = p

    def get(self, service: str) -> IntegrationProvider | None:
        return self._providers.get(service)

    def list_all(self) -> list[str]:
        return list(self._providers.keys())

    async def health_check_all(self, user_id: UUID | None = None) -> dict[str, Any]:
        """Run health checks against ALL providers and return a summary.

        Providers that read credentials from ``settings`` (Discord, Telegram,
        Trello, Jira, WhatsApp, Facebook) accept ``user_id`` via ``**kwargs``
        and silently ignore it — their health does NOT depend on which user
        is making the request.

        Providers that rely on per‑user OAuth tokens (Google Drive, Gmail)
        use ``user_id`` to look up the correct token row in PostgreSQL.
        """
        results: dict[str, Any] = {}
        for name, provider in self._providers.items():
            try:
                # `.env` providers ignore user_id via **kwargs — correct
                # OAuth providers use it to find per‑user tokens
                health = await provider.health_check(user_id=user_id)
                results[name] = {
                    "connected": health.connected,
                    "status": health.status,
                    "message": health.message,
                    "details": health.details,
                }
            except Exception as exc:
                logger.warning("Provider %s health check failed: %s", name, exc)
                results[name] = {
                    "connected": False,
                    "status": "error",
                    "message": str(exc),
                    "details": {},
                }
        return results

    def list_available_integrations(self) -> list[dict[str, Any]]:
        """Return all integrations with metadata for the frontend."""
        meta_map: dict[str, dict[str, Any]] = {
            "discord": {"label": "Discord", "icon": "discord", "color": "#5865F2", "category": "communication"},
            "telegram": {"label": "Telegram", "icon": "telegram", "color": "#26A5E4", "category": "communication"},
            "whatsapp": {"label": "WhatsApp Business", "icon": "whatsapp", "color": "#25D366", "category": "communication"},
            "facebook": {"label": "Facebook Pages", "icon": "facebook", "color": "#1877F2", "category": "social"},
            "trello": {"label": "Trello", "icon": "trello", "color": "#0052CC", "category": "project_management"},
            "jira": {"label": "Jira", "icon": "jira", "color": "#0052CC", "category": "project_management"},
            "google_drive": {"label": "Google Drive", "icon": "googledrive", "color": "#4285F4", "category": "storage"},
            "gmail": {"label": "Gmail", "icon": "gmail", "color": "#EA4335", "category": "communication"},
        }
        result = []
        for name in self.list_all():
            meta = meta_map.get(name, {"label": name, "icon": name, "color": "#666", "category": "other"})
            result.append({"service": name, **meta, "available": True})
        for future in _FUTURE_PROVIDERS:
            result.append({**future, "available": False, "color": "#999", "category": "coming_soon"})
        return result


_integration_service: IntegrationService | None = None


def get_integration_service() -> IntegrationService:
    global _integration_service
    if _integration_service is None:
        _integration_service = IntegrationService()
    return _integration_service
