"""Gmail Integration Provider — read, search, send emails via OAuth."""

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


class GmailProvider:
    service_name = "gmail"
    _oauth = GoogleOAuthService()

    async def _get_token(self, user_id: UUID | None = None) -> OAuthToken | None:
        if user_id is None:
            return None
        async with AsyncSessionLocal() as session:
            repo = SQLAlchemyOAuthTokenRepository(session)
            token = await repo.find_by_user_and_service(
                user_id=user_id, provider="google", service="gmail"
            )
            if token is None:
                return None
            return await self._oauth.get_valid_token(token)

    async def health_check(self, user_id: UUID | None = None) -> IntegrationHealth:
        token = await self._get_token(user_id)
        if token is None:
            return IntegrationHealth(service=self.service_name, connected=False, status="disconnected", message="No Gmail token — connect via OAuth")
        try:
            await self._oauth.list_messages(token.access_token, max_results=1)
            return IntegrationHealth(service=self.service_name, connected=True, status="connected", message="Gmail accessible")
        except Exception as exc:
            return IntegrationHealth(service=self.service_name, connected=False, status="error", message=str(exc))

    async def execute_action(self, action: str, params: dict[str, Any], user_id: UUID | None = None) -> IntegrationAction:
        try:
            token = await self._get_token(user_id)
            if token is None:
                return IntegrationAction(success=False, action=action, error="Not connected to Gmail")

            if action == "send_email":
                return await self._send(token.access_token, params)
            if action == "list_messages":
                result = await self._oauth.list_messages(token.access_token, query=params.get("query", ""), max_results=params.get("max_results", 20))
                return IntegrationAction(success=True, action=action, result=result)
            if action == "get_message":
                msg_id = params.get("message_id", "")
                result = await self._oauth.get_message(token.access_token, msg_id)
                return IntegrationAction(success=True, action=action, result=result)
            return IntegrationAction(success=False, action=action, error=f"Unknown action: {action}")
        except Exception as exc:
            return IntegrationAction(success=False, action=action, error=str(exc))

    async def validate_credentials(self) -> bool:
        health = await self.health_check()
        return health.connected

    async def _send(self, token: str, params: dict[str, Any]) -> IntegrationAction:
        to = params.get("to", "")
        subject = params.get("subject", "Pytomatiza+ Notification")
        body = params.get("body", params.get("content", params.get("message", "")))
        result = await self._oauth.send_email(token, to=to, subject=subject, body=body)
        return IntegrationAction(success=True, action="send_email", result={"id": result.get("id"), "threadId": result.get("threadId")})
