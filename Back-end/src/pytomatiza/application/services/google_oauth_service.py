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
_GOOGLE_PHOTOS_API = "https://photoslibrary.googleapis.com/v1"


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
