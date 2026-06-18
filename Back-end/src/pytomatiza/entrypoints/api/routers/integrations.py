"""Integrations router — Google Drive and Google Photos OAuth + API proxy."""

from __future__ import annotations

from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from pytomatiza.application.dtos.integration_dtos import (
    GmailMessagesResponse,
    GoogleDriveFile,
    GoogleDriveFilesResponse,
    GooglePhotosAlbum,
    GooglePhotosAlbumsResponse,
    OAuthConnectionStatus,
)
from pytomatiza.application.services.google_oauth_service import GoogleOAuthService
from pytomatiza.domain.entities.user import User
from pytomatiza.entrypoints.api.deps import get_current_user, get_db
from pytomatiza.infrastructure.repositories.sqlalchemy_oauth_token_repository import (
    SQLAlchemyOAuthTokenRepository,
)

router = APIRouter()


# ── Google Drive ───────────────────────────────────────────────────────


@router.get("/google-drive/status", response_model=OAuthConnectionStatus)
async def get_drive_connection_status(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> OAuthConnectionStatus:
    """Check if the authenticated user has a valid Google Drive connection."""
    token_repo = SQLAlchemyOAuthTokenRepository(db)
    token = await token_repo.find_by_user_and_service(current_user.id, "google", "drive")

    if token is None:
        return OAuthConnectionStatus(
            connected=False, service="drive", email=str(current_user.email)
        )

    valid_token = await GoogleOAuthService.get_valid_token(token)
    if valid_token is None:
        return OAuthConnectionStatus(
            connected=False, service="drive", email=str(current_user.email)
        )

    return OAuthConnectionStatus(
        connected=True, service="drive", email=str(current_user.email)
    )


@router.delete("/google-drive/disconnect", response_model=None)
async def disconnect_google_drive(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, str | bool]:
    """Disconnect Google Drive integration (remove stored token)."""
    token_repo = SQLAlchemyOAuthTokenRepository(db)
    deleted: bool = await token_repo.delete(current_user.id, "google", "drive")
    return {
        "message": (
            "Google Drive disconnected successfully."
            if deleted
            else "No active Google Drive connection found."
        ),
        "disconnected": deleted,
    }


@router.get("/google-drive/files", response_model=GoogleDriveFilesResponse)
async def list_drive_files(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    query: Annotated[str | None, Query(description="Search query filter")] = None,
    page_size: Annotated[int, Query(ge=1, le=100)] = 50,
    page_token: Annotated[str | None, Query(description="Pagination token")] = None,
) -> GoogleDriveFilesResponse:
    """List files from the authenticated user's Google Drive."""
    token_repo = SQLAlchemyOAuthTokenRepository(db)
    token = await token_repo.find_by_user_and_service(current_user.id, "google", "drive")

    if token is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Google Drive is not connected. Please connect your account first.",
        )

    valid_token = await GoogleOAuthService.get_valid_token(token)
    if valid_token is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Google Drive token has expired and cannot be refreshed. Please reconnect.",
        )

    await token_repo.upsert(valid_token)

    try:
        data: dict[str, Any] = await GoogleOAuthService.list_drive_files(
            access_token=valid_token.access_token,
            query=query,
            page_size=page_size,
            page_token=page_token,
        )
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc

    files: list[GoogleDriveFile] = [
        GoogleDriveFile(
            id=str(f.get("id", "")),
            name=str(f.get("name", "Untitled")),
            mime_type=str(f.get("mimeType", "application/octet-stream")),
            size=str(f["size"]) if f.get("size") is not None else None,
            web_view_link=str(f["webViewLink"]) if f.get("webViewLink") else None,
            created_at=str(f["createdTime"]) if f.get("createdTime") else None,
            modified_at=str(f["modifiedTime"]) if f.get("modifiedTime") else None,
        )
        for f in data.get("files", [])
    ]

    return GoogleDriveFilesResponse(
        files=files,
        next_page_token=str(data["nextPageToken"]) if data.get("nextPageToken") else None,
    )


# ── Google Photos ──────────────────────────────────────────────────────


@router.get("/google-photos/status", response_model=OAuthConnectionStatus)
async def get_photos_connection_status(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> OAuthConnectionStatus:
    """Check if the authenticated user has a valid Google Photos connection."""
    token_repo = SQLAlchemyOAuthTokenRepository(db)
    token = await token_repo.find_by_user_and_service(current_user.id, "google", "photos")

    if token is None:
        return OAuthConnectionStatus(
            connected=False, service="photos", email=str(current_user.email)
        )

    valid_token = await GoogleOAuthService.get_valid_token(token)
    if valid_token is None:
        return OAuthConnectionStatus(
            connected=False, service="photos", email=str(current_user.email)
        )

    return OAuthConnectionStatus(
        connected=True, service="photos", email=str(current_user.email)
    )


@router.delete("/google-photos/disconnect", response_model=None)
async def disconnect_google_photos(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, str | bool]:
    """Disconnect Google Photos integration (remove stored token)."""
    token_repo = SQLAlchemyOAuthTokenRepository(db)
    deleted: bool = await token_repo.delete(current_user.id, "google", "photos")
    return {
        "message": (
            "Google Photos disconnected successfully."
            if deleted
            else "No active Google Photos connection found."
        ),
        "disconnected": deleted,
    }


@router.get("/google-photos/albums", response_model=GooglePhotosAlbumsResponse)
async def list_photos_albums(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    page_size: Annotated[int, Query(ge=1, le=50)] = 50,
    page_token: Annotated[str | None, Query(description="Pagination token")] = None,
) -> GooglePhotosAlbumsResponse:
    """List albums from the authenticated user's Google Photos."""
    token_repo = SQLAlchemyOAuthTokenRepository(db)
    token = await token_repo.find_by_user_and_service(current_user.id, "google", "photos")

    if token is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Google Photos is not connected. Please connect your account first.",
        )

    valid_token = await GoogleOAuthService.get_valid_token(token)
    if valid_token is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Google Photos token has expired. Please reconnect.",
        )

    await token_repo.upsert(valid_token)

    try:
        data: dict[str, Any] = await GoogleOAuthService.list_photos_albums(
            access_token=valid_token.access_token,
            page_size=page_size,
            page_token=page_token,
        )
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc

    albums: list[GooglePhotosAlbum] = [
    GooglePhotosAlbum(
        id=str(a.get("id", "")),
        title=str(a.get("title", "Untitled")),
        item_count=str(a["mediaItemsCount"]) if a.get("mediaItemsCount") is not None else None,
        cover_url=(
            str(a.get("coverPhotoBaseUrl", "")) + "=w200-h200"
            if a.get("coverPhotoBaseUrl") is not None
            else None
        ),
    )
    for a in data.get("albums", [])
]

    return GooglePhotosAlbumsResponse(
        albums=albums,
        next_page_token=str(data["nextPageToken"]) if data.get("nextPageToken") else None,
    )


# ── Gmail ────────────────────────────────────────────────────────────────


@router.get("/google-gmail/status", response_model=OAuthConnectionStatus)
async def get_gmail_connection_status(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> OAuthConnectionStatus:
    """Check if the authenticated user has a valid Gmail connection."""
    token_repo = SQLAlchemyOAuthTokenRepository(db)
    token = await token_repo.find_by_user_and_service(current_user.id, "google", "gmail")
    if token is None:
        return OAuthConnectionStatus(connected=False, service="gmail", email=str(current_user.email))
    valid_token = await GoogleOAuthService.get_valid_token(token)
    if valid_token is None:
        return OAuthConnectionStatus(connected=False, service="gmail", email=str(current_user.email))
    return OAuthConnectionStatus(connected=True, service="gmail", email=str(current_user.email))


@router.delete("/google-gmail/disconnect", response_model=dict)
async def disconnect_gmail(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    """Disconnect Gmail by removing the stored OAuth token."""
    token_repo = SQLAlchemyOAuthTokenRepository(db)
    await token_repo.delete_by_user_and_service(current_user.id, "google", "gmail")
    return {"message": "Gmail disconnected", "disconnected": True}


@router.get("/google-gmail/messages", response_model=GmailMessagesResponse)
async def list_gmail_messages(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    query: str = Query(default=""),
    max_results: int = Query(default=20, ge=1, le=100),
) -> GmailMessagesResponse:
    """List recent Gmail messages, optionally filtered by query."""
    token_repo = SQLAlchemyOAuthTokenRepository(db)
    token = await token_repo.find_by_user_and_service(current_user.id, "google", "gmail")
    if token is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Gmail not connected")
    valid_token = await GoogleOAuthService.get_valid_token(token)
    if valid_token is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Gmail token expired")
    try:
        data = await GoogleOAuthService.list_messages(valid_token.access_token, query=query, max_results=max_results)
        messages = data.get("messages", [])
        return GmailMessagesResponse(messages=[{"id": m.get("id", ""), "thread_id": m.get("threadId", ""), "snippet": "", "subject": "", "sender": "", "received_at": ""} for m in messages], result_size_estimate=data.get("resultSizeEstimate", 0))
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc