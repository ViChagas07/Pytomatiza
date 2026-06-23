"""Google Integration Provider — unified class for all Google services.

Replaces the previous 5 duplicated providers (Drive, Gmail, Calendar,
Sheets, Meet) with a single class parameterised by ``service``.

All tokens are stored encrypted in the ``integration_tokens`` table
via ``IntegrationTokenRepository``. Actual Google API calls continue
to use ``GoogleOAuthService``.
"""

from __future__ import annotations

import logging
from typing import Any
from uuid import UUID

from pytomatiza.application.services.google_oauth_service import GoogleOAuthService
from pytomatiza.domain.services.integrations.provider import (
    IntegrationAction,
    IntegrationHealth,
    IntegrationProvider,
)
from pytomatiza.infrastructure.db.session import AsyncSessionLocal
from pytomatiza.infrastructure.repositories.integration_token_repository import (
    IntegrationTokenRepository,
)

logger = logging.getLogger(__name__)

# Map each service to its Google API scope
_SERVICE_SCOPES: dict[str, str] = {
    "drive": "https://www.googleapis.com/auth/drive.file",
    "gmail": "https://www.googleapis.com/auth/gmail.modify",
    "calendar": "https://www.googleapis.com/auth/calendar",
    "sheets": "https://www.googleapis.com/auth/spreadsheets",
    "meet": "https://www.googleapis.com/auth/calendar",
    "photos": "https://www.googleapis.com/auth/photoslibrary.readonly",
}


class GoogleProvider(IntegrationProvider):
    """Unified provider for all Google OAuth services.

    Usage::

        provider = GoogleProvider(service="drive")
        health = await provider.health_check(user_id=user.id)
    """

    service_name = "google"  # overridden by subclasses

    def __init__(self, service: str = "") -> None:
        self._service = service
        self._oauth = GoogleOAuthService()

    async def _get_token(self, user_id: UUID | None = None) -> Any | None:
        """Load the Google OAuth token from ``integration_tokens``."""
        if user_id is None or not self._service:
            return None
        async with AsyncSessionLocal() as session:
            repo = IntegrationTokenRepository(session)
            token = await repo.find_by_user_and_service(
                user_id=user_id,
                provider="google",
                service=self._service,
            )
            if token is None:
                return None
            return token

    async def health_check(self, user_id: UUID | None = None) -> IntegrationHealth:
        token = await self._get_token(user_id)
        if token is None:
            return IntegrationHealth(
                service=self.service_name, connected=False,
                status="disconnected",
                message=f"Google {self._service} não conectado — autorize via OAuth",
            )

        svc = self._service
        access = token.access_token

        try:
            if svc == "drive":
                await self._oauth.list_drive_files(access, page_size=1)
            elif svc == "gmail":
                await self._oauth.list_messages(access, max_results=1)
            elif svc in ("calendar", "meet"):
                ok = await self._oauth.check_calendar_access(access)
                if not ok:
                    return IntegrationHealth(
                        service=self.service_name, connected=False,
                        status="error",
                        message="Calendar/Meet API retornou erro",
                    )
            elif svc == "sheets":
                ok = await self._oauth.check_sheets_access(access)
                if not ok:
                    return IntegrationHealth(
                        service=self.service_name, connected=False,
                        status="error",
                        message="Sheets API retornou erro",
                    )
            elif svc == "photos":
                await self._oauth.list_photos_albums(access, page_size=1)
            else:
                return IntegrationHealth(
                    service=self.service_name, connected=False,
                    status="error",
                    message=f"Serviço Google desconhecido: {svc}",
                )

            return IntegrationHealth(
                service=self.service_name, connected=True,
                status="connected",
                message=f"Google {svc} acessível",
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
                    error=f"Google {self._service} não conectado",
                )
            access = token.access_token
            svc = self._service

            # ── Drive actions ───────────────────────────────────────
            if svc == "drive":
                return await self._drive_action(action, params, access)

            # ── Gmail actions ───────────────────────────────────────
            if svc == "gmail":
                return await self._gmail_action(action, params, access)

            # ── Calendar actions ────────────────────────────────────
            if svc == "calendar":
                return await self._calendar_action(action, params, access)

            # ── Meet actions ────────────────────────────────────────
            if svc == "meet":
                return await self._meet_action(action, params, access)

            # ── Sheets actions ──────────────────────────────────────
            if svc == "sheets":
                return await self._sheets_action(action, params, access)

            return IntegrationAction(
                success=False, action=action,
                error=f"Ação desconhecida para {svc}: {action}",
            )
        except Exception as exc:
            return IntegrationAction(
                success=False, action=action, error=str(exc),
            )

    async def validate_credentials(self) -> bool:
        health = await self.health_check()
        return health.connected

    # ── Service-specific action dispatchers ────────────────────────────

    async def _drive_action(
        self, action: str, params: dict[str, Any], access_token: str,
    ) -> IntegrationAction:
        if action == "list_files":
            result = await self._oauth.list_drive_files(
                access_token,
                page_size=params.get("page_size", 20),
            )
            return IntegrationAction(success=True, action=action, result=result)
        if action == "upload_file":
            file_name = params.get("file_name", params.get("name", "upload"))
            content = params.get("content", b"")
            if isinstance(content, str):
                content = content.encode("utf-8")
            mime = params.get("mime_type", "application/octet-stream")
            folder = params.get("folder_id")
            result = await self._oauth.upload_file(access_token, file_name, content, mime, folder)
            return IntegrationAction(
                success=True, action=action,
                result={"id": result.get("id"), "name": result.get("name"),
                        "webViewLink": result.get("webViewLink")},
            )
        if action == "create_folder":
            name = params.get("name", "New Folder")
            parent = params.get("parent_id")
            result = await self._oauth.create_folder(access_token, name, parent)
            return IntegrationAction(
                success=True, action=action,
                result={"id": result.get("id"), "name": result.get("name")},
            )
        if action == "search_files":
            result = await self._oauth.search_files(
                access_token,
                query=params.get("query", ""),
                page_size=params.get("page_size", 20),
            )
            return IntegrationAction(success=True, action=action, result=result)
        return IntegrationAction(
            success=False, action=action,
            error=f"Ação Drive desconhecida: {action}",
        )

    async def _gmail_action(
        self, action: str, params: dict[str, Any], access_token: str,
    ) -> IntegrationAction:
        if action == "send_email":
            to = params.get("to", "")
            subject = params.get("subject", "Pytomatiza+ Notification")
            body = params.get("body", params.get("content", ""))
            result = await self._oauth.send_email(access_token, to, subject, body)
            return IntegrationAction(
                success=True, action=action,
                result={"id": result.get("id"), "threadId": result.get("threadId")},
            )
        if action == "list_messages":
            result = await self._oauth.list_messages(
                access_token,
                query=params.get("query", ""),
                max_results=params.get("max_results", 20),
            )
            return IntegrationAction(success=True, action=action, result=result)
        if action == "get_message":
            msg_id = params.get("message_id", "")
            result = await self._oauth.get_message(access_token, msg_id)
            return IntegrationAction(success=True, action=action, result=result)
        return IntegrationAction(
            success=False, action=action,
            error=f"Ação Gmail desconhecida: {action}",
        )

    async def _calendar_action(
        self, action: str, params: dict[str, Any], access_token: str,
    ) -> IntegrationAction:
        if action == "list_events":
            result = await self._oauth.list_calendar_events(
                access_token,
                calendar_id="primary",
                max_results=params.get("max_results", 10),
            )
            return IntegrationAction(success=True, action=action, result=result)
        if action == "create_event":
            result = await self._oauth.create_calendar_event(
                access_token,
                calendar_id="primary",
                summary=params.get("summary", "Event"),
                description=params.get("description", ""),
                start_time=params.get("start_time"),
                end_time=params.get("end_time"),
                attendees=params.get("attendees", []),
            )
            return IntegrationAction(success=True, action=action, result=result)
        return IntegrationAction(
            success=False, action=action,
            error=f"Ação Calendar desconhecida: {action}",
        )

    async def _meet_action(
        self, action: str, params: dict[str, Any], access_token: str,
    ) -> IntegrationAction:
        if action == "create_meeting":
            result = await self._oauth.create_calendar_event(
                access_token,
                calendar_id="primary",
                summary=params.get("summary", "Video Meeting"),
                description=params.get("description", ""),
                start_time=params.get("start_time"),
                end_time=params.get("end_time"),
                attendees=params.get("attendees", []),
                conference=True,
            )
            return IntegrationAction(success=True, action=action, result=result)
        if action == "list_meetings":
            result = await self._oauth.list_calendar_events(
                access_token,
                calendar_id="primary",
                max_results=params.get("max_results", 10),
            )
            return IntegrationAction(success=True, action=action, result=result)
        return IntegrationAction(
            success=False, action=action,
            error=f"Ação Meet desconhecida: {action}",
        )

    async def _sheets_action(
        self, action: str, params: dict[str, Any], access_token: str,
    ) -> IntegrationAction:
        if action == "create_spreadsheet":
            title = params.get("title", "New Spreadsheet")
            result = await self._oauth.create_spreadsheet(access_token, title=title)
            return IntegrationAction(success=True, action=action, result=result)
        if action == "get_values":
            spreadsheet_id = params.get("spreadsheet_id", "")
            range_name = params.get("range", "A1:Z1000")
            result = await self._oauth.get_sheet_values(access_token, spreadsheet_id, range_name)
            return IntegrationAction(success=True, action=action, result=result)
        if action == "update_values":
            spreadsheet_id = params.get("spreadsheet_id", "")
            range_name = params.get("range", "A1")
            values = params.get("values", [])
            result = await self._oauth.update_sheet_values(access_token, spreadsheet_id, range_name, values)
            return IntegrationAction(success=True, action=action, result=result)
        return IntegrationAction(
            success=False, action=action,
            error=f"Ação Sheets desconhecida: {action}",
        )


# ── Backward-compatible aliases ─────────────────────────────────────────
# These class names are used by the existing IntegrationService registry.
# They remain as thin subclasses of GoogleProvider for a seamless transition.


class GoogleDriveProvider(GoogleProvider):
    service_name = "google_drive"

    def __init__(self) -> None:
        super().__init__(service="drive")


class GmailProvider(GoogleProvider):
    service_name = "gmail"

    def __init__(self) -> None:
        super().__init__(service="gmail")


class GoogleCalendarProvider(GoogleProvider):
    service_name = "google_calendar"

    def __init__(self) -> None:
        super().__init__(service="calendar")


class GoogleSheetsProvider(GoogleProvider):
    service_name = "google_sheets"

    def __init__(self) -> None:
        super().__init__(service="sheets")


class GoogleMeetProvider(GoogleProvider):
    service_name = "google_meet"

    def __init__(self) -> None:
        super().__init__(service="meet")
