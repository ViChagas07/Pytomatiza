"""DTOs for integration endpoints — OAuth connection status and API proxy data."""

from __future__ import annotations

from pydantic import BaseModel, Field


class OAuthConnectionStatus(BaseModel):
    """Status of an OAuth integration for a user and service."""

    connected: bool = Field(..., description="Whether the user has a valid token")
    service: str = Field(..., description="Service name (drive, photos, etc.)")
    email: str | None = Field(None, description="Google account email if connected")


class GoogleDriveFile(BaseModel):
    """Minimal representation of a Google Drive file."""

    id: str
    name: str
    mime_type: str
    size: str | None = None
    web_view_link: str | None = None
    created_at: str | None = None
    modified_at: str | None = None


class GoogleDriveFilesResponse(BaseModel):
    """Paginated list of Google Drive files."""

    files: list[GoogleDriveFile]
    next_page_token: str | None = None


class GooglePhotosAlbum(BaseModel):
    """Minimal representation of a Google Photos album."""

    id: str
    title: str
    item_count: str | None = None
    cover_url: str | None = None


class GooglePhotosAlbumsResponse(BaseModel):
    """Paginated list of Google Photos albums."""

    albums: list[GooglePhotosAlbum]
    next_page_token: str | None = None
