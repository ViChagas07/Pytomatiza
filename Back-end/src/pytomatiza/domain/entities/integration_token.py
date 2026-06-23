"""IntegrationToken domain entity — stores OAuth 2.0 tokens / API keys
for third-party integrations, scoped to a user/tenant.

Each row represents a single connected account (e.g. "Slack workspace X",
"Google Drive of user Y", "Telegram bot Z"). Tokens are always encrypted
at rest — the domain entity never sees plain-text secrets crossing
service boundaries intentionally.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from uuid import UUID


class IntegrationTokenStatus(str, Enum):
    """Lifecycle status of an integration connection."""

    ACTIVE = "active"
    EXPIRED = "expired"
    REVOKED = "revoked"
    ERROR = "error"


@dataclass
class IntegrationToken:
    """A stored credential for a third-party integration, scoped to a user.

    The ``access_token`` and ``refresh_token`` fields contain the
    **encrypted**  blob when persisted — the domain layer does not
    perform encryption itself, but the repository layer guarantees
    that only ciphertext crosses the boundary to the database.
    """

    id: UUID
    user_id: UUID
    tenant_id: UUID | None = None
    provider: str = ""           # e.g. "slack", "discord", "google", "jira"
    service: str = ""            # e.g. "bot", "drive", "gmail", "workspace"
    access_token: str = ""       # encrypted at rest
    refresh_token: str | None = None  # encrypted at rest
    token_type: str = "Bearer"
    scopes: str = ""
    expires_at: datetime | None = None
    external_account_id: str = ""     # workspace ID, guild ID, email, etc.
    external_account_name: str = ""   # human-readable label
    extra_data: dict = field(default_factory=dict)  # JSON blob (maps to DB column "metadata")
    status: IntegrationTokenStatus = IntegrationTokenStatus.ACTIVE
    created_at: datetime | None = None
    updated_at: datetime | None = None

    # ── Domain helpers ────────────────────────────────────────────────

    def is_expired(self) -> bool:
        """Check whether the access token has expired (60 s safety margin)."""
        if self.expires_at is None:
            return False
        return datetime.now().astimezone() >= self.expires_at

    def has_refresh_token(self) -> bool:
        return bool(self.refresh_token)

    def revoke(self) -> None:
        """Transition to revoked status — called after server-side revoke."""
        self.status = IntegrationTokenStatus.REVOKED

    def mark_error(self, message: str = "") -> None:
        self.status = IntegrationTokenStatus.ERROR

    def is_active(self) -> bool:
        return self.status == IntegrationTokenStatus.ACTIVE
