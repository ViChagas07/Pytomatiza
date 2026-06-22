"""Google Sheets Integration Provider — spreadsheets, cells via OAuth."""

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


class GoogleSheetsProvider:
    service_name = "google_sheets"
    _oauth = GoogleOAuthService()

    async def _get_token(self, user_id: UUID | None = None) -> OAuthToken | None:
        if user_id is None:
            return None
        async with AsyncSessionLocal() as session:
            repo = SQLAlchemyOAuthTokenRepository(session)
            token = await repo.find_by_user_and_service(
                user_id=user_id, provider="google", service="sheets"
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
                message="No Sheets token — connect via OAuth"
            )
        try:
            ok = await self._oauth.check_sheets_access(token.access_token)
            if ok:
                return IntegrationHealth(
                    service=self.service_name, connected=True,
                    status="connected", message="Sheets accessible"
                )
            return IntegrationHealth(
                service=self.service_name, connected=False,
                status="error", message="Sheets API returned error"
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
                    error="Not connected to Google Sheets"
                )

            if action == "create_spreadsheet":
                title = params.get("title", "New Spreadsheet")
                result = await self._oauth.create_spreadsheet(
                    token.access_token, title=title,
                )
                return IntegrationAction(
                    success=True, action=action, result=result
                )
            if action == "get_values":
                spreadsheet_id = params.get("spreadsheet_id", "")
                range_name = params.get("range", "A1:Z1000")
                result = await self._oauth.get_sheet_values(
                    token.access_token, spreadsheet_id, range_name,
                )
                return IntegrationAction(
                    success=True, action=action, result=result
                )
            if action == "update_values":
                spreadsheet_id = params.get("spreadsheet_id", "")
                range_name = params.get("range", "A1")
                values = params.get("values", [])
                result = await self._oauth.update_sheet_values(
                    token.access_token, spreadsheet_id, range_name, values,
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
