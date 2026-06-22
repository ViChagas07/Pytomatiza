"""Google Calendar Integration Provider — events, scheduling via OAuth."""

from __future__ import annotations

import logging
from typing import Any
from uuid import UUID

from pytomatiza.application.services.google_oauth_service import GoogleOAuthService
from pytomatiza.domain.entities.oauth_token import OAuthToken
from pytomatiza.domain.services.integrations.provider import (
    IntegrationAction,
    IntegrationHealth,
)
from pytomatiza.infrastructure.repositories.sqlalchemy_oauth_token_repository import (
    SQLAlchemyOAuthTokenRepository,
)
from pytomatiza.infrastructure.db.session import AsyncSessionLocal

logger = logging.getLogger(__name__)


class GoogleCalendarProvider:
    service_name = "google_calendar"
    _oauth = GoogleOAuthService()

    async def _get_token(self, user_id: UUID | None = None) -> OAuthToken | None:
        if user_id is None:
            return None
        async with AsyncSessionLocal() as session:
            repo = SQLAlchemyOAuthTokenRepository(session)
            token = await repo.find_by_user_and_service(
                user_id=user_id, provider="google", service="calendar"
            )
            if token is None:
                return None
            return await self._oauth.get_valid_token(token)

    async def health_check(self, user_id: UUID | None = None) -> IntegrationHealth:
        token = await self._get_token(user_id)
        if token is None:
            return IntegrationHealth(
                service=self.service_name, connected=False,
                status="disconnected",
                message="No Calendar token — connect via OAuth"
            )
        try:
            ok = await self._oauth.check_calendar_access(token.access_token)
            if ok:
                return IntegrationHealth(
                    service=self.service_name, connected=True,
                    status="connected", message="Calendar accessible"
                )
            return IntegrationHealth(
                service=self.service_name, connected=False,
                status="error", message="Calendar API returned error"
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
            token = await self._get_token(user_id)
            if token is None:
                return IntegrationAction(
                    success=False, action=action,
                    error="Not connected to Google Calendar"
                )

            if action == "list_events":
                max_results = params.get("max_results", 10)
                result = await self._oauth.list_calendar_events(
                    token.access_token, calendar_id="primary",
                    max_results=max_results,
                )
                return IntegrationAction(
                    success=True, action=action, result=result
                )
            if action == "create_event":
                result = await self._oauth.create_calendar_event(
                    token.access_token,
                    calendar_id="primary",
                    summary=params.get("summary", "Event"),
                    description=params.get("description", ""),
                    start_time=params.get("start_time"),
                    end_time=params.get("end_time"),
                    attendees=params.get("attendees", []),
                )
                return IntegrationAction(
                    success=True, action=action, result=result
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
