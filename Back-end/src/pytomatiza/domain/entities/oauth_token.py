"""OAuthToken domain entity — stores OAuth 2.0 tokens from external providers.

Used primarily for Google service integrations (Drive, Photos, etc.)
where offline access is required beyond the initial authentication flow.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass
class OAuthToken:
    """A stored OAuth 2.0 token for a user-provider-service combination.

    Each token represents a specific OAuth grant for a given service
    (e.g. Google Drive, Google Photos). The refresh token allows the
    backend to obtain new access tokens without user interaction.
    """

    id: UUID
    user_id: UUID
    provider: str  # e.g. "google"
    service: str  # e.g. "drive", "photos", "auth"
    access_token: str
    refresh_token: str | None
    token_type: str  # e.g. "Bearer"
    scopes: str  # space-separated scopes
    expires_at: datetime | None
    created_at: datetime
    updated_at: datetime

    def is_expired(self) -> bool:
        """Check if the access token has expired (with 60s safety buffer)."""
        if self.expires_at is None:
            return False
        return datetime.now().astimezone() >= self.expires_at

    def has_refresh_token(self) -> bool:
        """Whether this token has a refresh token for renewal."""
        return self.refresh_token is not None and len(self.refresh_token) > 0
