"""Google Drive Integration Provider — upload, search, organize files via OAuth."""

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


class GoogleDriveProvider:
    service_name = "google_drive"
    _oauth = GoogleOAuthService()

    async def _get_token(self, user_id: UUID | None = None) -> OAuthToken | None:
        if user_id is None:
            return None
        async with AsyncSessionLocal() as session:
            repo = SQLAlchemyOAuthTokenRepository(session)
            token = await repo.find_by_user_and_service(
                user_id=user_id, provider="google", service="drive"
            )
            if token is None:
                return None
            return await self._oauth.get_valid_token(token)

    async def health_check(self, user_id: UUID | None = None) -> IntegrationHealth:
        token = await self._get_token(user_id)
        if token is None:
            return IntegrationHealth(service=self.service_name, connected=False, status="disconnected", message="No Drive token — connect via OAuth")
        try:
            await self._oauth.list_drive_files(token.access_token, page_size=1)
            return IntegrationHealth(service=self.service_name, connected=True, status="connected", message="Drive accessible")
        except Exception as exc:
            return IntegrationHealth(service=self.service_name, connected=False, status="error", message=str(exc))

    async def execute_action(self, action: str, params: dict[str, Any], user_id: UUID | None = None) -> IntegrationAction:
        try:
            token = await self._get_token(user_id)
            if token is None:
                return IntegrationAction(success=False, action=action, error="Not connected to Google Drive")

            if action == "upload_file":
                return await self._upload(token.access_token, params)
            if action == "create_folder":
                return await self._create_folder(token.access_token, params)
            if action == "search_files":
                return await self._search(token.access_token, params)
            if action == "list_files":
                result = await self._oauth.list_drive_files(token.access_token, page_size=params.get("page_size", 20))
                return IntegrationAction(success=True, action=action, result=result)
            return IntegrationAction(success=False, action=action, error=f"Unknown action: {action}")
        except Exception as exc:
            return IntegrationAction(success=False, action=action, error=str(exc))

    async def validate_credentials(self) -> bool:
        health = await self.health_check()
        return health.connected

    async def _upload(self, token: str, params: dict[str, Any]) -> IntegrationAction:
        file_name = params.get("file_name", params.get("name", "upload"))
        content = params.get("content", "")
        if isinstance(content, str):
            content = content.encode("utf-8")
        mime = params.get("mime_type", "application/octet-stream")
        folder = params.get("folder_id")
        result = await self._oauth.upload_file(token, file_name, content, mime, folder)
        return IntegrationAction(success=True, action="upload_file", result={"id": result.get("id"), "name": result.get("name"), "webViewLink": result.get("webViewLink")})

    async def _create_folder(self, token: str, params: dict[str, Any]) -> IntegrationAction:
        name = params.get("name", params.get("folder_name", "New Folder"))
        parent = params.get("parent_id")
        result = await self._oauth.create_folder(token, name, parent)
        return IntegrationAction(success=True, action="create_folder", result={"id": result.get("id"), "name": result.get("name")})

    async def _search(self, token: str, params: dict[str, Any]) -> IntegrationAction:
        query = params.get("query", "")
        result = await self._oauth.search_files(token, query, params.get("page_size", 20))
        return IntegrationAction(success=True, action="search_files", result=result)
