"""GoogleOAuthService — handles token refresh and Google API proxy calls."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from uuid import UUID, uuid4
__all__ = ["UUID", "uuid4"]

import httpx
from typing import Any

from pytomatiza.config import settings
from pytomatiza.domain.entities.oauth_token import OAuthToken


_GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
_GOOGLE_DRIVE_API = "https://www.googleapis.com/drive/v3/files"
_GOOGLE_DRIVE_UPLOAD_API = "https://www.googleapis.com/upload/drive/v3/files"
_GOOGLE_GMAIL_API = "https://gmail.googleapis.com/gmail/v1/users/me"
_GOOGLE_PHOTOS_API = "https://photoslibrary.googleapis.com/v1"
_GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3"
_GOOGLE_SHEETS_API = "https://sheets.googleapis.com/v4/spreadsheets"


class GoogleOAuthService:
    """Service for managing Google OAuth tokens and proxying API calls."""

    @staticmethod
    async def refresh_access_token(token: OAuthToken) -> OAuthToken | None:
        """Exchange a refresh token for a new access token.

        Returns an updated OAuthToken on success, or None on failure
        (e.g. refresh token revoked).
        """
        if not token.has_refresh_token():
            return None

        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.post(
                _GOOGLE_TOKEN_URL,
                data={
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "refresh_token": token.refresh_token,
                    "grant_type": "refresh_token",
                },
            )
            if response.status_code != 200:
                return None

            data = response.json()
            expires_in = data.get("expires_in", 3600)
            token.access_token = data["access_token"]
            token.expires_at = datetime.now(timezone.utc) + timedelta(
                seconds=expires_in
            )
            # Google may rotate the refresh token
            if "refresh_token" in data:
                token.refresh_token = data["refresh_token"]
            return token

    @staticmethod
    async def get_valid_token(token: OAuthToken) -> OAuthToken | None:
        """Ensure the token is valid, refreshing if expired."""
        if token.is_expired():
            return await GoogleOAuthService.refresh_access_token(token)
        return token

    @staticmethod
    async def list_drive_files(
        access_token: str,
        query: str | None = None,
        page_size: int = 50,
        page_token: str | None = None,
    ) -> dict[str, Any]:
        """List files from Google Drive API.

        Args:
            access_token: Valid Google OAuth access token.
            query: Optional search query (e.g. "mimeType='application/pdf'").
            page_size: Number of results per page (max 1000).
            page_token: Token for the next page of results.

        Returns:
            Raw JSON response from the Drive API.
        """
        params: dict[str, str | int] = {
            "pageSize": min(page_size, 100),
            "fields": "nextPageToken,files(id,name,mimeType,size,webViewLink,createdTime,modifiedTime)",
            "orderBy": "modifiedTime desc",
        }
        if query:
            params["q"] = query
        if page_token:
            params["pageToken"] = page_token

        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.get(
                _GOOGLE_DRIVE_API,
                params=params,
                headers={"Authorization": f"Bearer {access_token}"},
            )
            if response.status_code != 200:
                error_text = response.text[:200]
                raise RuntimeError(
                    f"Google Drive API error ({response.status_code}): {error_text}"
                )
            return response.json()

    @staticmethod
    async def list_photos_albums(
        access_token: str,
        page_size: int = 50,
        page_token: str | None = None,
    ) -> dict[str, Any]:
        """List albums from Google Photos Library API.

        Args:
            access_token: Valid Google OAuth access token.
            page_size: Number of results per page (max 50).
            page_token: Token for the next page of results.

        Returns:
            Raw JSON response from the Photos API.
        """
        params: dict[str, str | int] = {
            "pageSize": min(page_size, 50),
        }
        if page_token:
            params["pageToken"] = page_token

        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.get(
                f"{_GOOGLE_PHOTOS_API}/albums",
                params=params,
                headers={"Authorization": f"Bearer {access_token}"},
            )
            if response.status_code != 200:
                error_text = response.text[:200]
                raise RuntimeError(
                    f"Google Photos API error ({response.status_code}): {error_text}"
                )
            return response.json()

    # ── Google Drive — Write Operations ───────────────────────────────

    @staticmethod
    async def upload_file(
        access_token: str,
        file_name: str,
        content: bytes,
        mime_type: str = "application/octet-stream",
        folder_id: str | None = None,
    ) -> dict[str, Any]:
        """Upload a file to Google Drive (multipart).

        Args:
            access_token: Valid Google OAuth access token.
            file_name: Name of the file in Drive.
            content: Raw file bytes.
            mime_type: MIME type of the file.
            folder_id: Optional parent folder ID.

        Returns:
            JSON response with file metadata (id, name, webViewLink).
        """
        metadata: dict[str, Any] = {"name": file_name}
        if folder_id:
            metadata["parents"] = [folder_id]

        boundary = "pytomatiza_boundary_001"
        body = (
            f"--{boundary}\r\n"
            f"Content-Type: application/json; charset=UTF-8\r\n\r\n"
            f"{__import__('json').dumps(metadata)}\r\n"
            f"--{boundary}\r\n"
            f"Content-Type: {mime_type}\r\n\r\n"
        ).encode("utf-8") + content + f"\r\n--{boundary}--\r\n".encode("utf-8")

        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(
                f"{_GOOGLE_DRIVE_UPLOAD_API}?uploadType=multipart",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": f"multipart/related; boundary={boundary}",
                },
                content=body,
            )
            if resp.status_code not in (200, 201):
                raise RuntimeError(f"Drive upload failed ({resp.status_code}): {resp.text[:200]}")
            return resp.json()

    @staticmethod
    async def create_folder(
        access_token: str,
        folder_name: str,
        parent_id: str | None = None,
    ) -> dict[str, Any]:
        """Create a folder in Google Drive."""
        metadata: dict[str, Any] = {
            "name": folder_name,
            "mimeType": "application/vnd.google-apps.folder",
        }
        if parent_id:
            metadata["parents"] = [parent_id]

        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                _GOOGLE_DRIVE_API,
                json=metadata,
                headers={"Authorization": f"Bearer {access_token}"},
            )
            if resp.status_code not in (200, 201):
                raise RuntimeError(f"Drive folder creation failed ({resp.status_code})")
            return resp.json()

    @staticmethod
    async def search_files(
        access_token: str,
        query: str,
        page_size: int = 20,
    ) -> dict[str, Any]:
        """Search files in Google Drive with a query string."""
        return await GoogleOAuthService.list_drive_files(
            access_token, query=query, page_size=page_size
        )

    # ── Gmail Operations ───────────────────────────────────────────────

    @staticmethod
    async def list_messages(
        access_token: str,
        query: str = "",
        max_results: int = 20,
    ) -> dict[str, Any]:
        """List messages from Gmail, optionally filtered by query."""
        params: dict[str, str | int] = {"maxResults": min(max_results, 100)}
        if query:
            params["q"] = query

        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                f"{_GOOGLE_GMAIL_API}/messages",
                params=params,
                headers={"Authorization": f"Bearer {access_token}"},
            )
            if resp.status_code != 200:
                raise RuntimeError(f"Gmail list failed ({resp.status_code}): {resp.text[:200]}")
            return resp.json()

    @staticmethod
    async def get_message(
        access_token: str,
        message_id: str,
    ) -> dict[str, Any]:
        """Get a full Gmail message by ID (with decoded body)."""
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                f"{_GOOGLE_GMAIL_API}/messages/{message_id}?format=full",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            if resp.status_code != 200:
                raise RuntimeError(f"Gmail get failed ({resp.status_code}): {resp.text[:200]}")
            return resp.json()

    @staticmethod
    async def send_email(
        access_token: str,
        to: str,
        subject: str,
        body: str,
        cc: str = "",
        bcc: str = "",
    ) -> dict[str, Any]:
        """Send an email via Gmail API.

        The email is encoded in RFC 2822 format and base64url-encoded.
        """
        import base64
        from email.mime.text import MIMEText

        msg = MIMEText(body, _subtype="plain", _charset="UTF-8")
        msg["to"] = to
        msg["subject"] = subject
        if cc:
            msg["cc"] = cc
        if bcc:
            msg["bcc"] = bcc

        raw = base64.urlsafe_b64encode(msg.as_bytes()).decode("utf-8")

        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                f"{_GOOGLE_GMAIL_API}/messages/send",
                json={"raw": raw},
                headers={"Authorization": f"Bearer {access_token}"},
            )
            if resp.status_code != 200:
                raise RuntimeError(f"Gmail send failed ({resp.status_code}): {resp.text[:200]}")
            return resp.json()

    @staticmethod
    async def watch_messages(
        access_token: str,
        topic_name: str,
        label_ids: list[str] | None = None,
    ) -> dict[str, Any]:
        """Set up Gmail push notifications for new messages."""
        payload: dict[str, Any] = {"topicName": topic_name}
        if label_ids:
            payload["labelIds"] = label_ids
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                f"{_GOOGLE_GMAIL_API}/watch",
                json=payload,
                headers={"Authorization": f"Bearer {access_token}"},
            )
            if resp.status_code != 200:
                raise RuntimeError(f"Gmail watch failed ({resp.status_code})")
            return resp.json()

    # ── Calendar Operations ──────────────────────────────────────────

    @staticmethod
    async def check_calendar_access(access_token: str) -> bool:
        """Verify Calendar API access by fetching the primary calendar."""
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(
                    f"{_GOOGLE_CALENDAR_API}/calendars/primary/events",
                    params={"maxResults": 1},
                    headers={"Authorization": f"Bearer {access_token}"},
                )
                return resp.status_code == 200
        except Exception:
            return False

    @staticmethod
    async def list_calendar_events(
        access_token: str,
        calendar_id: str = "primary",
        max_results: int = 10,
        page_token: str | None = None,
    ) -> dict[str, Any]:
        """List upcoming events from a Google Calendar."""
        params: dict[str, str | int] = {
            "maxResults": min(max_results, 250),
            "orderBy": "startTime",
            "singleEvents": "true",
        }
        if page_token:
            params["pageToken"] = page_token

        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                f"{_GOOGLE_CALENDAR_API}/calendars/{calendar_id}/events",
                params=params,
                headers={"Authorization": f"Bearer {access_token}"},
            )
            if resp.status_code != 200:
                raise RuntimeError(
                    f"Calendar API error ({resp.status_code}): {resp.text[:200]}"
                )
            return resp.json()

    @staticmethod
    async def create_calendar_event(
        access_token: str,
        calendar_id: str = "primary",
        summary: str = "Event",
        description: str = "",
        start_time: str | None = None,
        end_time: str | None = None,
        attendees: list[str] | None = None,
        conference: bool = False,
    ) -> dict[str, Any]:
        """Create an event on a Google Calendar.  If ``conference`` is ``True``
        the event will include a Google Meet link."""
        from datetime import datetime, timedelta, timezone

        start_dt = start_time or datetime.now(timezone.utc).isoformat()
        end_dt = end_time or (
            datetime.now(timezone.utc) + timedelta(hours=1)
        ).isoformat()

        body: dict[str, Any] = {
            "summary": summary,
            "description": description,
            "start": {"dateTime": start_dt, "timeZone": "UTC"},
            "end": {"dateTime": end_dt, "timeZone": "UTC"},
        }
        if attendees:
            body["attendees"] = [{"email": a} for a in attendees]
        if conference:
            body["conferenceData"] = {
                "createRequest": {
                    "requestId": str(uuid4()),
                    "conferenceSolutionKey": {"type": "hangoutsMeet"},
                }
            }

        params = {"conferenceDataVersion": "1"} if conference else {}

        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                f"{_GOOGLE_CALENDAR_API}/calendars/{calendar_id}/events",
                params=params,
                json=body,
                headers={"Authorization": f"Bearer {access_token}"},
            )
            if resp.status_code not in (200, 201):
                raise RuntimeError(
                    f"Calendar create failed ({resp.status_code}): {resp.text[:200]}"
                )
            return resp.json()

    # ── Sheets Operations ────────────────────────────────────────────

    @staticmethod
    async def check_sheets_access(access_token: str) -> bool:
        """Verify Sheets API access by listing spreadsheet files via Drive API."""
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(
                    _GOOGLE_DRIVE_API,
                    params={
                        "q": "mimeType='application/vnd.google-apps.spreadsheet'",
                        "pageSize": 1,
                        "fields": "files(id)",
                    },
                    headers={"Authorization": f"Bearer {access_token}"},
                )
                return resp.status_code == 200
        except Exception:
            return False

    @staticmethod
    async def create_spreadsheet(
        access_token: str,
        title: str = "New Spreadsheet",
    ) -> dict[str, Any]:
        """Create a new empty Google Spreadsheet."""
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                _GOOGLE_SHEETS_API,
                json={"properties": {"title": title}},
                headers={"Authorization": f"Bearer {access_token}"},
            )
            if resp.status_code not in (200, 201):
                raise RuntimeError(
                    f"Sheets create failed ({resp.status_code}): {resp.text[:200]}"
                )
            return resp.json()

    @staticmethod
    async def get_sheet_values(
        access_token: str,
        spreadsheet_id: str,
        range_name: str = "A1:Z1000",
    ) -> dict[str, Any]:
        """Read values from a Google Spreadsheet range."""
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                f"{_GOOGLE_SHEETS_API}/{spreadsheet_id}/values/{range_name}",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            if resp.status_code != 200:
                raise RuntimeError(
                    f"Sheets read failed ({resp.status_code}): {resp.text[:200]}"
                )
            return resp.json()

    @staticmethod
    async def update_sheet_values(
        access_token: str,
        spreadsheet_id: str,
        range_name: str,
        values: list[list[str]],
    ) -> dict[str, Any]:
        """Write values to a Google Spreadsheet range (overwrites)."""
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.put(
                f"{_GOOGLE_SHEETS_API}/{spreadsheet_id}/values/{range_name}?valueInputOption=USER_ENTERED",
                json={"values": values, "majorDimension": "ROWS"},
                headers={"Authorization": f"Bearer {access_token}"},
            )
            if resp.status_code != 200:
                raise RuntimeError(
                    f"Sheets update failed ({resp.status_code}): {resp.text[:200]}"
                )
            return resp.json()

    # ── Token Revocation (OAuth server‑side) ─────────────────────────

    _GOOGLE_REVOKE_URL = "https://oauth2.googleapis.com/revoke"

    @staticmethod
    async def revoke_token(access_token: str) -> bool:
        """Revoke a Google OAuth token server‑side.

        Per RFC 7009 and Google's OAuth 2.0 docs, this tells Google to
        invalidate the token so it cannot be used again, even if we
        still have a copy.  Always call this before deleting the stored
        token from the database.

        Returns True if revocation succeeded (or token was already
        invalid), False only on a transport error.
        """
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.post(
                    "https://oauth2.googleapis.com/revoke",
                    params={"token": access_token},
                    headers={"Content-Type": "application/x-www-form-urlencoded"},
                )
                # Google returns 200 on success OR if the token was already revoked
                return resp.status_code == 200
        except Exception:
            return False
